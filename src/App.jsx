import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Smile, Meh, Frown, AlertCircle, Heart, ShieldCheck, 
  UserCheck, Users, Settings, BarChart3, Plus, Trash2, Edit2, Send, Lock, LogOut
} from 'lucide-react';

const SUPABASE_URL = 'https://lvibeaqjluxqgfllydgj.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_1vvViGET6AnAATweHmLP3g_ggfM27D9';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'notaria11';

export default function App() {
  const [ruta, setRuta] = useState(window.location.pathname);
  const [autenticadoAdmin, setAutenticadoAdmin] = useState(localStorage.getItem('admin_auth') === 'true');
  const [inputPassword, setInputPassword] = useState('');
  
  const [personalActivo, setPersonalActivo] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [agradeciendo, setAgradeciendo] = useState(false);

  const [listaPersonal, setListaPersonal] = useState([]);
  const [votos, setVotos] = useState([]);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoCargo, setNuevoCargo] = useState('');
  const [editandoId, setEditandoId] = useState(null);
  const [nombreEdit, setNombreEdit] = useState('');
  const [cargoEdit, setCargoEdit] = useState('');

  useEffect(() => {

    const handlePopState = () => setRuta(window.location.pathname);
    window.addEventListener('popstate', handlePopState);

    obtenerPersonalEnTurno();
    cargarDatosAdmin();

    const channel = supabase
      .channel('cambios-globales')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'personal' }, () => {
        obtenerPersonalEnTurno();
        cargarDatosAdmin();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'votos' }, () => {
        cargarDatosAdmin();
      })
      .subscribe();

    return () => {
      window.removeEventListener('popstate', handlePopState);
      supabase.removeChannel(channel);
    };
  }, []);

  const obtenerPersonalEnTurno = async () => {
    try {
      const { data, error } = await supabase
        .from('personal')
        .select('*')
        .eq('en_turno', true)
        .limit(1);
      
      if (error) throw error;
      setPersonalActivo(data && data.length > 0 ? data[0] : null);
    } catch (err) {
      console.error('Error al obtener personal en turno:', err.message);
    }
  };

  const cargarDatosAdmin = async () => {
    try {
      const { data: pData } = await supabase.from('personal').select('*').order('nombre');
      if (pData) setListaPersonal(pData);

      const { data: vData } = await supabase.from('votos').select('*, personal(nombre, cargo)');
      if (vData) setVotos(vData);
    } catch (err) {
      console.error('Error al cargar datos administrativos:', err.message);
    }
  };

  const registrarVoto = async (calificacion) => {
    if (!personalActivo) return;
    try {
      setCargando(true);
      const { error } = await supabase
        .from('votos')
        .insert([{ personal_id: personalActivo.id, calificacion }]);

      if (error) throw error;
      setAgradeciendo(true);
      setTimeout(() => setAgradeciendo(false), 3000);
    } catch (err) {
      console.error('Error al votar:', err.message);
    } finally {
      setCargando(false);
    }
  };

  const loginAdmin = (e) => {
    e.preventDefault();
    if (inputPassword === ADMIN_PASSWORD) {
      localStorage.setItem('admin_auth', 'true');
      setAutenticadoAdmin(true);
    } else {
      alert('Contraseña incorrecta');
      setInputPassword('');
    }
  };

  const logoutAdmin = () => {
    localStorage.removeItem('admin_auth');
    setAutenticadoAdmin(false);
    window.history.pushState({}, '', '/');
    setRuta('/');
  };


  const cambiarTurnoOperador = async (idSeleccionado) => {
    try {
      await supabase.from('personal').update({ en_turno: false }).neq('id', 0);
      if (idSeleccionado) {
        await supabase.from('personal').update({ en_turno: true }).eq('id', idSeleccionado);
      }
      obtenerPersonalEnTurno();
      cargarDatosAdmin();
    } catch (err) {
      alert('Error al cambiar turno: ' + err.message);
    }
  };

  const agregarPersonal = async (e) => {
    e.preventDefault();
    if (!nuevoNombre.trim()) return;
    try {
      const { error } = await supabase.from('personal').insert([{ nombre: nuevoNombre, cargo: nuevoCargo || 'Notario / Asistente', en_turno: false }]);
      if (error) throw error;
      setNuevoNombre('');
      setNuevoCargo('');
      cargarDatosAdmin();
    } catch (err) {
      alert('Error al agregar personal: ' + err.message);
    }
  };

  const eliminarPersonal = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este registro?')) return;
    try {
      await supabase.from('personal').delete().eq('id', id);
      cargarDatosAdmin();
    } catch (err) {
      alert('Error al eliminar: ' + err.message);
    }
  };

  const guardarEdicion = async (id) => {
    try {
      await supabase.from('personal').update({ nombre: nombreEdit, cargo: cargoEdit }).eq('id', id);
      setEditandoId(null);
      cargarDatosAdmin();
    } catch (err) {
      alert('Error al actualizar: ' + err.message);
    }
  };

  const enviarReporteWhatsApp = () => {
    const totalVotos = votos.length;
    const promedioGeneral = totalVotos > 0 ? (votos.reduce((acc, v) => acc + v.calificacion, 0) / totalVotos).toFixed(2) : '0';
    
    let mensaje = `*REPORTE DE ATENCIÓN - NOTARÍA Nº 11*%0A`;
    mensaje += `Fecha: ${new Date().toLocaleDateString()}%0A`;
    mensaje += `Promedio General: ${promedioGeneral} / 5.0%0A`;
    mensaje += `Total Evaluaciones: ${totalVotos}%0A%0A`;
    mensaje += `--- *DETALLE POR FUNCIONARIO* ---%0A`;

    listaPersonal.forEach(p => {
      const votosPersona = votos.filter(v => v.personal_id === p.id);
      const prom = votosPersona.length > 0 ? (votosPersona.reduce((a, b) => a + b.calificacion, 0) / votosPersona.length).toFixed(1) : 'Sin votos';
      mensaje += `• *${p.nombre}* (${p.cargo}): ${prom} (${votosPersona.length} calificaciones)%0A`;
    });

    const url = `https://api.whatsapp.com/send?text=${mensaje}`;
    window.open(url, '_blank');
  };

  
  if (ruta.startsWith('/admin')) {
    if (!autenticadoAdmin) {
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
          <form onSubmit={loginAdmin} className="bg-slate-900 border border-slate-800 p-8 rounded-3xl max-w-sm w-full shadow-2xl text-center">
            <div className="w-16 h-16 bg-amber-500/10 text-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-500/20">
              <Lock className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Panel Administrador</h2>
            <p className="text-slate-400 text-xs mb-6">Ingrese la contraseña de gestión de la Notaría Nº 11</p>
            <input 
              type="password" 
              placeholder="Contraseña" 
              value={inputPassword}
              onChange={e => setInputPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm mb-4 focus:outline-none focus:border-amber-500 text-center"
              autoFocus
            />
            <button type="submit" className="w-full bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold py-3 rounded-xl text-sm transition">
              Ingresar al Sistema
            </button>
          </form>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12">
        <div className="max-w-6xl mx-auto">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-900 border border-slate-800 p-6 rounded-3xl mb-8 shadow-xl gap-4">
            <div>
              <span className="bg-amber-500/10 text-amber-400 text-xs font-bold px-3 py-1 rounded-full border border-amber-500/20">
                Panel Gerencial Seguro
              </span>
              <h1 className="text-3xl font-extrabold text-white mt-2">Notaría Nº 11 - Administración</h1>
              <p className="text-slate-400 text-sm">Control de turnos en ventanilla, gestión de personal y reportes ejecutivos.</p>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={enviarReporteWhatsApp}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-lg transition"
              >
                <Send className="w-4 h-4" /> Enviar Reporte WhatsApp
              </button>
              <button 
                onClick={logoutAdmin}
                className="bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 px-3 py-2.5 rounded-xl font-semibold flex items-center gap-1 transition"
                title="Cerrar Sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl mb-8 shadow-xl">
            <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-amber-400" /> Operador Activo en Ventanilla (Tablet)
            </h2>
            <p className="text-slate-400 text-sm mb-6">Selecciona quién está atendiendo en este momento. La tablet cambiará al instante en tiempo real.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {listaPersonal.map(p => (
                <div 
                  key={p.id}
                  onClick={() => cambiarTurnoOperador(p.id)}
                  className={`p-4 rounded-2xl border cursor-pointer transition flex items-center justify-between ${
                    p.en_turno 
                      ? 'bg-amber-500/10 border-amber-500 text-white shadow-lg' 
                      : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <h4 className="font-bold text-base text-slate-200">{p.nombre}</h4>
                    <p className="text-xs text-slate-400">{p.cargo}</p>
                  </div>
                  <div>
                    {p.en_turno ? (
                      <span className="bg-amber-500 text-slate-950 text-xs font-bold px-3 py-1 rounded-full animate-pulse">
                        EN TURNO
                      </span>
                    ) : (
                      <span className="text-xs text-slate-600">Activar</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {personalActivo && (
              <div className="mt-4 text-right">
                <button 
                  onClick={() => cambiarTurnoOperador(null)}
                  className="text-xs text-red-400 hover:text-red-300 underline"
                >
                  Pausar turno actual (dejar tablet en reposo)
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-400" /> Gestión de Personal (CRUD)
              </h2>

              <form onSubmit={agregarPersonal} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 mb-6 flex flex-col gap-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Agregar Nuevo Funcionario</span>
                <input 
                  type="text" 
                  placeholder="Nombre completo" 
                  value={nuevoNombre}
                  onChange={e => setNuevoNombre(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                />
                <input 
                  type="text" 
                  placeholder="Cargo (ej. Notario Asistente)" 
                  value={nuevoCargo}
                  onChange={e => setNuevoCargo(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                />
                <button type="submit" className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold py-2 rounded-xl text-sm flex items-center justify-center gap-2 transition">
                  <Plus className="w-4 h-4" /> Registrar Funcionario
                </button>
              </form>

              <div className="space-y-3 max-h-72 overflow-y-auto pr-2">
                {listaPersonal.map(p => (
                  <div key={p.id} className="bg-slate-950 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
                    {editandoId === p.id ? (
                      <div className="flex-1 flex gap-2 mr-2">
                        <input 
                          type="text" 
                          value={nombreEdit} 
                          onChange={e => setNombreEdit(e.target.value)}
                          className="bg-slate-900 border border-slate-700 px-2 py-1 rounded text-sm text-white flex-1"
                        />
                        <input 
                          type="text" 
                          value={cargoEdit} 
                          onChange={e => setCargoEdit(e.target.value)}
                          className="bg-slate-900 border border-slate-700 px-2 py-1 rounded text-sm text-white flex-1"
                        />
                        <button onClick={() => guardarEdicion(p.id)} className="bg-emerald-600 text-white px-3 py-1 rounded text-xs">Guardar</button>
                      </div>
                    ) : (
                      <div>
                        <h4 className="font-bold text-white text-sm">{p.nombre}</h4>
                        <p className="text-xs text-slate-400">{p.cargo}</p>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      {editandoId !== p.id && (
                        <button 
                          onClick={() => { setEditandoId(p.id); setNombreEdit(p.nombre); setCargoEdit(p.cargo); }}
                          className="text-slate-400 hover:text-amber-400 p-1"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={() => eliminarPersonal(p.id)} className="text-slate-400 hover:text-red-400 p-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-emerald-400" /> Resumen de Calificaciones
              </h2>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center">
                  <span className="text-slate-400 text-xs">Total Evaluaciones</span>
                  <h3 className="text-3xl font-extrabold text-white mt-1">{votos.length}</h3>
                </div>
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center">
                  <span className="text-slate-400 text-xs">Promedio General</span>
                  <h3 className="text-3xl font-extrabold text-amber-400 mt-1">
                    {votos.length > 0 ? (votos.reduce((a, b) => a + b.calificacion, 0) / votos.length).toFixed(2) : '0.0'} ⭐
                  </h3>
                </div>
              </div>

              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Desempeño por Funcionario</span>
                {listaPersonal.map(p => {
                  const misVotos = votos.filter(v => v.personal_id === p.id);
                  const prom = misVotos.length > 0 ? (misVotos.reduce((a, b) => a + b.calificacion, 0) / misVotos.length).toFixed(1) : '0.0';
                  return (
                    <div key={p.id} className="bg-slate-950 border border-slate-800 p-3 rounded-xl flex items-center justify-between text-sm">
                      <span className="font-semibold text-slate-200">{p.nombre}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-slate-400">{misVotos.length} votos</span>
                        <span className="bg-amber-500/10 text-amber-400 font-bold px-2.5 py-1 rounded-lg border border-amber-500/20">
                          {prom} 
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

        </div>
      </div>
    );
  }

  
  if (!personalActivo || agradeciendo) {
    return (
      <div className="relative w-screen h-screen bg-slate-950 overflow-hidden flex items-center justify-center select-none">
        {agradeciendo ? (
          <div className="text-center animate-fadeIn z-30">
            <div className="w-24 h-24 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl animate-bounce">
              <ShieldCheck className="w-12 h-12" />
            </div>
            <h2 className="text-4xl md:text-6xl font-extrabold text-white mb-4">¡Muchas gracias!</h2>
            <p className="text-xl text-slate-400">Su opinión nos ayuda a mejorar la atención en la Notaría Nº 11.</p>
          </div>
        ) : (
          <div className="relative w-full h-full flex flex-col items-center justify-center bg-slate-900">
            <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover opacity-40">
              <source src="https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-notary-signing-a-document-41662-large.mp4" type="video/mp4" />
            </video>
            <div className="z-10 text-center p-8 bg-slate-950/70 backdrop-blur-md rounded-3xl border border-slate-800 shadow-2xl max-w-xl mx-4">
              <span className="bg-amber-600 text-white font-bold px-4 py-1.5 rounded-full text-xs uppercase tracking-wider">
                Notaría Nº 11
              </span>
              <h1 className="text-3xl md:text-4xl font-extrabold text-white mt-4 mb-2">
                Sistema de Calificación en Espera
              </h1>
              <p className="text-slate-400 text-sm">
                La tablet está lista. En cuanto el operador active su turno, aparecerá la pantalla de satisfacción.
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative w-screen h-screen bg-slate-900 flex flex-col justify-between p-8 md:p-16 select-none">
      <div className="flex justify-between items-center bg-slate-800/80 border border-slate-700 rounded-2xl px-6 py-4 shadow-lg">
        <div>
          <span className="text-xs text-amber-400 font-bold uppercase tracking-wider">Atendido por:</span>
          <h3 className="text-2xl font-bold text-white">{personalActivo.nombre}</h3>
          <p className="text-sm text-slate-400">{personalActivo.cargo}</p>
        </div>
      </div>

      <div className="text-center my-auto">
        <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-12">
          ¿Cómo califica la atención recibida?
        </h2>
        <div className="grid grid-cols-5 gap-4 md:gap-8 max-w-4xl mx-auto">
          <button disabled={cargando} onClick={() => registrarVoto(1)} className="flex flex-col items-center group">
            <div className="w-20 h-20 md:w-32 md:h-32 rounded-3xl bg-red-500/10 border-2 border-red-500/30 group-hover:bg-red-500 flex items-center justify-center text-red-400 group-hover:text-white transition shadow-lg transform group-hover:scale-105">
              <Frown className="w-10 h-10 md:w-16 md:h-16" />
            </div>
            <span className="text-sm font-semibold text-slate-300 mt-3 group-hover:text-red-400">Muy Malo</span>
          </button>
          <button disabled={cargando} onClick={() => registrarVoto(2)} className="flex flex-col items-center group">
            <div className="w-20 h-20 md:w-32 md:h-32 rounded-3xl bg-orange-500/10 border-2 border-orange-500/30 group-hover:bg-orange-500 flex items-center justify-center text-orange-400 group-hover:text-white transition shadow-lg transform group-hover:scale-105">
              <AlertCircle className="w-10 h-10 md:w-16 md:h-16" />
            </div>
            <span className="text-sm font-semibold text-slate-300 mt-3 group-hover:text-orange-400">Malo</span>
          </button>
          <button disabled={cargando} onClick={() => registrarVoto(3)} className="flex flex-col items-center group">
            <div className="w-20 h-20 md:w-32 md:h-32 rounded-3xl bg-yellow-500/10 border-2 border-yellow-500/30 group-hover:bg-yellow-500 flex items-center justify-center text-yellow-400 group-hover:text-white transition shadow-lg transform group-hover:scale-105">
              <Meh className="w-10 h-10 md:w-16 md:h-16" />
            </div>
            <span className="text-sm font-semibold text-slate-300 mt-3 group-hover:text-yellow-400">Regular</span>
          </button>
          <button disabled={cargando} onClick={() => registrarVoto(4)} className="flex flex-col items-center group">
            <div className="w-20 h-20 md:w-32 md:h-32 rounded-3xl bg-emerald-500/10 border-2 border-emerald-500/30 group-hover:bg-emerald-500 flex items-center justify-center text-emerald-400 group-hover:text-white transition shadow-lg transform group-hover:scale-105">
              <Smile className="w-10 h-10 md:w-16 md:h-16" />
            </div>
            <span className="text-sm font-semibold text-slate-300 mt-3 group-hover:text-emerald-400">Bueno</span>
          </button>
          <button disabled={cargando} onClick={() => registrarVoto(5)} className="flex flex-col items-center group">
            <div className="w-20 h-20 md:w-32 md:h-32 rounded-3xl bg-green-500/10 border-2 border-green-500/30 group-hover:bg-green-600 flex items-center justify-center text-green-400 group-hover:text-white transition shadow-lg transform group-hover:scale-105">
              <Heart className="w-10 h-10 md:w-16 md:h-16" />
            </div>
            <span className="text-sm font-semibold text-slate-300 mt-3 group-hover:text-green-400">Excelente</span>
          </button>
        </div>
      </div>

      <div className="text-center text-slate-500 text-xs">
        Notaría Nº 11 &bull; Toque la carita según su experiencia
      </div>
    </div>
  );
}