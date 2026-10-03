import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Lock, 
  LogOut, 
  Award, 
  BarChart2, 
  CheckCircle, 
  Home, 
  Users,
  Trash2,
  ChevronLeft,
  ChevronRight,
  PieChart,
  Star,
  Share2,
  Maximize,
  UserCheck
} from 'lucide-react';
import './index.css'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default function App() {
  const [ruta, setRuta] = useState(window.location.pathname);
  const [personal, setPersonal] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [autenticadoAdmin, setAutenticadoAdmin] = useState(
    localStorage.getItem('admin_auth') === 'true'
  );

  const cambiarRuta = (nuevaRuta) => {
    window.history.pushState({}, '', nuevaRuta);
    setRuta(nuevaRuta);
  };

  useEffect(() => {
    const handlePopState = () => setRuta(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    fetchPersonal();

    const channelPersonal = supabase
      .channel('public:personal')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'personal' },
        (payload) => {
          console.log('Cambio detectado en personal:', payload);
          fetchPersonal();
        }
      )
      .subscribe((status) => {
        console.log('Estado canal personal:', status);
      });

    return () => {
      supabase.removeChannel(channelPersonal);
    };
  }, []);

  const fetchPersonal = async () => {
    setCargando(true);
    const { data, error } = await supabase
      .from('personal')
      .select('*')
      .order('nombre', { ascending: true });
    
    if (error) {
      console.error('Error al cargar personal:', error);
    } else {
      setPersonal(data || []);
    }
    setCargando(false);
  };

  return (
    <div className={`min-h-screen ${ruta === '/admin' || ruta === '/personal' ? 'bg-[#0b0b0e]' : 'bg-[#2e054f]'} text-[#f8f5fa] flex flex-col font-sans select-none overflow-x-hidden`}>
      {ruta === '/admin' ? (
        autenticadoAdmin ? (
          <PanelAdmin 
            personal={personal} 
            fetchPersonal={fetchPersonal} 
            cambiarRuta={cambiarRuta} 
            setAutenticadoAdmin={setAutenticadoAdmin} 
          />
        ) : (
          <LoginAdmin 
            setAutenticadoAdmin={setAutenticadoAdmin} 
            cambiarRuta={cambiarRuta} 
          />
        )
      ) : ruta === '/personal' ? (
        <SeleccionTurnoSimple 
          personal={personal} 
          fetchPersonal={fetchPersonal} 
          cambiarRuta={cambiarRuta} 
        />
      ) : (
        <VistaKiosko 
          personal={personal} 
          cargando={cargando} 
          cambiarRuta={cambiarRuta}
        />
      )}
    </div>
  );
}


function VistaKiosko({ personal, cambiarRuta }) {
  const [enviado, setEnviado] = useState(false);
  const [enPantallaCompleta, setEnPantallaCompleta] = useState(false);

  const funcionarioEnTurno = personal.find(p => p.en_turno);

  const opcionesCalificacion = [
    { puntuacion: 1, emoji: '😡', etiqueta: 'Insatisfecho' },
    { puntuacion: 2, emoji: '😕', etiqueta: 'Poco satisfecho' },
    { puntuacion: 3, emoji: '😐', etiqueta: 'Neutral' },
    { puntuacion: 4, emoji: '😊', etiqueta: 'Satisfecho' },
    { puntuacion: 5, emoji: '🤩', etiqueta: 'Excelente' },
  ];

  const activarPantallaCompleta = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error("Error al intentar activar pantalla completa:", err);
      });
      setEnPantallaCompleta(true);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setEnPantallaCompleta(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const manejarCalificacionInstantanea = async (puntuacion) => {
    if (!funcionarioEnTurno || enviado) return;

    const { error } = await supabase.from('votos').insert([
      {
        personal_id: funcionarioEnTurno.id,
        calificacion: puntuacion,
        comentario: null
      }
    ]);

    if (error) {
      alert('Error al registrar la calificación. Intente nuevamente.');
      console.error(error);
    } else {
      setEnviado(true);
      setTimeout(() => {
        setEnviado(false);
      }, 2500); 
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-between p-4 sm:p-6 w-full h-screen overflow-hidden relative">
      {!enPantallaCompleta && (
        <div className="absolute top-3 right-3 z-50 flex gap-2">
          {/*<button
            onClick={() => cambiarRuta('/personal')}
            className="bg-[#3b0764] hover:bg-[#4c1d95] text-[#f3d5c0] border border-[#e5c1a7]/40 px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-xl transition cursor-pointer font-medium"
            title="Seleccionar Funcionario en Turno"
          >
            <UserCheck className="w-4 h-4 text-[#e5c1a7]" /> Cambiar Turno
          </button>*/}
          <button
            onClick={activarPantallaCompleta}
            className="bg-[#3b0764] hover:bg-[#4c1d95] text-[#f3d5c0] border border-[#e5c1a7]/40 px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-xl transition cursor-pointer font-medium"
          >
            <Maximize className="w-4 h-4 text-[#e5c1a7]" /> Pantalla Completa
          </button>
        </div>
      )}

<header className="border-b border-[#581c87] pb-3 text-center shrink-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#f3d5c0] flex items-center justify-center gap-3">
          <img 
            src="/logo.png" 
            alt="Logo Notaría 11" 
            className="w-20 h-20 object-contain" 
          /> 
          Notaría de Fe Pública Nº 11
        </h1>
        <p className="text-xs sm:text-sm text-[#d8b4fe] mt-1">¿Cómo califica la atención recibida hoy?</p>
      </header>

      <main className="my-auto grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-center max-w-7xl mx-auto w-full py-2">
        <div className="lg:col-span-7 flex flex-col justify-center h-full">
          {enviado ? (
            <div className="bg-[#1b0736] border border-[#581c87] p-10 rounded-2xl text-center max-w-lg mx-auto animate-fade-in w-full shadow-2xl">
              <CheckCircle className="w-20 h-20 text-[#e5c1a7] mx-auto mb-4 animate-bounce" />
              <h2 className="text-3xl font-bold text-[#f3d5c0]">¡Muchas Gracias!</h2>
              <p className="text-[#d8b4fe] text-lg mt-2">Su opinión es muy importante para nosotros.</p>
            </div>
          ) : !funcionarioEnTurno ? (
            <div className="text-center p-10 bg-[#1b0736] border border-[#581c87] rounded-2xl max-w-lg mx-auto w-full shadow-xl">
              <h2 className="text-2xl font-semibold text-[#f3d5c0]">Sistema en Pausa</h2>
              <p className="text-[#d8b4fe] text-base mt-2">No hay un funcionario activo en turno en este momento.</p>
            </div>
          ) : (
            <div className="bg-[#1b0736] border border-[#581c87] p-6 sm:p-8 rounded-2xl max-w-lg mx-auto w-full shadow-2xl text-center">
              <div className="mb-4 inline-block bg-[#29094f] border border-[#e5c1a7]/30 px-4 py-1.5 rounded-full text-[#f3d5c0] text-xs font-medium">
                Atendiendo ahora: <span className="font-bold text-[#e5c1a7]">{funcionarioEnTurno.nombre}</span> ({funcionarioEnTurno.cargo})
              </div>
              <h2 className="text-base font-medium text-[#f8f5fa] mb-6">
                Seleccione una opcion por favor:
              </h2>

              <div className="grid grid-cols-5 gap-2 mb-2">
                {opcionesCalificacion.map((item) => (
                  <button
                    type="button"
                    key={item.puntuacion}
                    onClick={() => manejarCalificacionInstantanea(item.puntuacion)}
                    className="flex flex-col items-center justify-between p-2 sm:p-3 rounded-xl bg-[#29094f] border border-[#581c87] hover:border-[#e5c1a7] transition transform active:scale-95 hover:scale-105 focus:outline-none cursor-pointer group h-32 sm:h-36 shadow-md"
                    title={item.etiqueta}
                  >
                    <span className="text-5xl sm:text-6xl group-hover:scale-110 transition my-auto">{item.emoji}</span>
                    <span className="text-[11px] sm:text-xs text-[#f3d5c0] font-medium whitespace-nowrap overflow-hidden text-ellipsis w-full text-center mt-2">
                      {item.etiqueta}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-5 bg-[#1b0736] border border-[#581c87] p-4 rounded-2xl flex flex-col items-center justify-center shadow-xl h-full max-h-[420px] min-h-[300px]">
          <div className="w-full h-full relative rounded-xl overflow-hidden bg-[#29094f] flex items-center justify-center shadow-inner border border-[#581c87]">
            <video 
              autoPlay 
              loop 
              muted 
              playsInline 
              className="w-full h-full object-cover rounded-xl"
            >
              <source src="/video-notaria.mp4" type="video/mp4" />
              Tu navegador no soporta la reproducción de videos.
            </video>
            <div className="absolute top-3 left-3 bg-[#1b0736]/90 backdrop-blur-md px-3 py-1 rounded-full border border-[#e5c1a7]/40 text-xs text-[#f3d5c0] font-medium shadow-md">
              Notaría Nº 11 - En Línea
            </div>
          </div>
        </div>
      </main>

      <footer className="text-center text-xs text-[#d8b4fe]/70 border-t border-[#581c87] pt-3 shrink-0">
        Notaría Nº 11 &copy; {new Date().getFullYear()} - Sistema de Calidad de Atención al Cliente
      </footer>
    </div>
  );
}


function SeleccionTurnoSimple({ personal, fetchPersonal, cambiarRuta }) {
  const [mensajeExito, setMensajeExito] = useState(null);

  const seleccionarTurno = async (idSeleccionado, nombreFuncionario) => {
    const { error: errorDesactivar } = await supabase
      .from('personal')
      .update({ en_turno: false })
      .neq('id', 0);

    if (errorDesactivar) {
      alert('Error al actualizar turnos.');
      console.error(errorDesactivar);
      return;
    }

    const { error: errorActivar } = await supabase
      .from('personal')
      .update({ en_turno: true })
      .eq('id', idSeleccionado);

    if (errorActivar) {
      alert('Error al asignar el turno.');
      console.error(errorActivar);
    } else {
      fetchPersonal();
      setMensajeExito(`¡Turno actualizado! Ahora atiende: ${nombreFuncionario}`);
      setTimeout(() => {
        setMensajeExito(null);
      }, 3000);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6 max-w-3xl mx-auto w-full">
      <div className="bg-[#121216] border border-[#581c87]/60 p-8 rounded-2xl w-full shadow-2xl relative">
        {mensajeExito && (
          <div className="mb-4 bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 px-4 py-3 rounded-xl text-xs sm:text-sm flex items-center gap-2 animate-fade-in shadow-lg">
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{mensajeExito}</span>
          </div>
        )}

        <div className="flex justify-between items-center mb-6 border-b border-[#3f2257] pb-4">
          <div>
            <h2 className="text-xl font-bold text-[#f3d5c0] flex items-center gap-2">
              <UserCheck className="w-6 h-6 text-[#e5c1a7]" /> Selección de Personal en Turno
            </h2>
            <p className="text-xs text-[#d8b4fe] mt-1">Haga clic sobre el funcionario para activarlo instantáneamente.</p>
          </div>
          {/*<button
            onClick={() => cambiarRuta('/')}
            className="bg-[#3b0764] hover:bg-[#4c1d95] text-[#f3d5c0] border border-[#e5c1a7]/40 px-4 py-2 rounded-xl text-xs font-medium transition cursor-pointer shadow-md"
          >
            Ir al Kiosko
          </button>*/}
        </div>

        <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
          {personal.map((p) => (
            <div 
              key={p.id}
              onClick={() => seleccionarTurno(p.id, p.nombre)}
              className={`p-4 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                p.en_turno 
                  ? 'bg-[#1b1526] border-[#e5c1a7] shadow-lg ring-1 ring-[#e5c1a7]/30' 
                  : 'bg-[#18181f] border-[#3f2257]/60 hover:border-[#e5c1a7]/60'
              }`}
            >
              <div>
                <h3 className="text-base font-bold text-[#f8f5fa] flex items-center gap-2">
                  {p.nombre}
                  {p.en_turno && (
                    <span className="text-[10px] bg-[#3b0764] text-[#e5c1a7] px-2.5 py-0.5 rounded-full border border-[#e5c1a7]/40 font-semibold">
                      EN TURNO ACTUAL
                    </span>
                  )}
                </h3>
                <p className="text-xs text-[#d8b4fe]">{p.cargo}</p>
              </div>

              <button
                type="button"
                className={`px-4 py-2 rounded-lg text-xs font-bold transition shadow-sm ${
                  p.en_turno
                    ? 'bg-[#e5c1a7] text-[#121216]'
                    : 'bg-[#3b0764] text-[#f3d5c0] border border-[#e5c1a7]/40 hover:bg-[#4c1d95]'
                }`}
              >
                {p.en_turno ? 'Activo' : 'Seleccionar'}
              </button>
            </div>
          ))}

          {personal.length === 0 && (
            <p className="text-center text-[#d8b4fe] py-8 text-sm">No hay personal registrado en el sistema.</p>
          )}
        </div>
      </div>
    </div>
  );
}


function LoginAdmin({ setAutenticadoAdmin, cambiarRuta }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === 'notaria11') {
      localStorage.setItem('admin_auth', 'true');
      setAutenticadoAdmin(true);
    } else {
      setError(true);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="bg-[#121216] border border-[#581c87]/60 p-8 rounded-2xl max-w-md w-full shadow-2xl">
        <button
          onClick={() => cambiarRuta('/')}
          className="text-[#d8b4fe] hover:text-[#f3d5c0] flex items-center gap-2 mb-6 text-sm transition"
        >
          <Home className="w-4 h-4" /> Ir a la Calificación
        </button>

        <div className="text-center mb-6">
          <Lock className="w-12 h-12 text-[#e5c1a7] mx-auto mb-2" />
          <h2 className="text-xl font-bold text-[#f3d5c0]">Acceso Administrativo</h2>
          <p className="text-xs text-[#d8b4fe] mt-1">Ingrese la contraseña para ver reportes y gestionar personal</p>
        </div>

        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(false); }}
              placeholder="Contraseña de administrador"
              className="w-full bg-[#18181f] border border-[#3f2257] rounded-lg p-3 text-[#f8f5fa] focus:outline-none focus:border-[#e5c1a7] text-sm"
            />
            {error && <p className="text-rose-400 text-xs mt-1">Contraseña incorrecta.</p>}
          </div>

          <button
            type="submit"
            className="w-full bg-[#3b0764] hover:bg-[#4c1d95] text-[#f3d5c0] border border-[#e5c1a7]/40 font-bold py-3 rounded-xl transition shadow-lg cursor-pointer"
          >
            Ingresar al Panel
          </button>
        </form>
      </div>
    </div>
  );
}


function PanelAdmin({ personal, fetchPersonal, cambiarRuta, setAutenticadoAdmin }) {
  const [calificaciones, setCalificaciones] = useState([]);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoCargo, setNuevoCargo] = useState('');
  const [cargandoReportes, setCargandoReportes] = useState(true);

  const [paginaActual, setPaginaActual] = useState(1);
  const registrosPorPagina = 10;

  const obtenerDetalleCalificacion = (puntuacion) => {
    const mapa = { 
      1: { emoji: '😡', texto: 'Insatisfecho' }, 
      2: { emoji: '😕', texto: 'Poco satisfecho' }, 
      3: { emoji: '😐', texto: 'Neutral' }, 
      4: { emoji: '😊', texto: 'Satisfecho' }, 
      5: { emoji: '🤩', texto: 'Excelente' } 
    };
    return mapa[puntuacion] || { emoji: '⭐', texto: `${puntuacion} pts` };
  };

  useEffect(() => {
    fetchCalificaciones();

    const channelVotos = supabase
      .channel('public:votos')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'votos' },
        (payload) => {
          console.log('Nuevo voto recibido en vivo:', payload);
          fetchCalificaciones();
        }
      )
      .subscribe((status) => {
        console.log('Estado canal votos:', status);
      });

    return () => {
      supabase.removeChannel(channelVotos);
    };
  }, []);

  const fetchCalificaciones = async () => {
    setCargandoReportes(true);
    const { data, error } = await supabase
      .from('votos')
      .select('*, personal(id, nombre, cargo)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error al cargar calificaciones:', error);
    } else {
      setCalificaciones(data || []);
    }
    setCargandoReportes(false);
  };

  const agregarPersonal = async (e) => {
    e.preventDefault();
    if (!nuevoNombre.trim() || !nuevoCargo.trim()) return;

    const { error } = await supabase.from('personal').insert([
      { nombre: nuevoNombre.trim(), cargo: nuevoCargo.trim(), en_turno: false }
    ]);

    if (error) {
      alert('Error al registrar personal.');
      console.error(error);
    } else {
      setNuevoNombre('');
      setNuevoCargo('');
      fetchPersonal();
    }
  };

  const seleccionarTurno = async (idSeleccionado) => {
    const { error: errorDesactivar } = await supabase
      .from('personal')
      .update({ en_turno: false })
      .neq('id', 0);

    if (errorDesactivar) {
      alert('Error al actualizar turnos.');
      console.error(errorDesactivar);
      return;
    }

    const { error: errorActivar } = await supabase
      .from('personal')
      .update({ en_turno: true })
      .eq('id', idSeleccionado);

    if (errorActivar) {
      alert('Error al asignar el turno.');
      console.error(errorActivar);
    } else {
      fetchPersonal();
    }
  };

  const eliminarPersonal = async (id) => {
    if (!window.confirm('¿Está seguro de eliminar a este funcionario? Se perderán sus estadísticas asociadas.')) return;

    const { error } = await supabase.from('personal').delete().eq('id', id);
    if (error) {
      alert('Error al eliminar funcionario.');
      console.error(error);
    } else {
      fetchPersonal();
      fetchCalificaciones();
    }
  };

  const logoutAdmin = () => {
    localStorage.removeItem('admin_auth');
    setAutenticadoAdmin(false);
    cambiarRuta('/');
  };

  const totalPaginas = Math.ceil(calificaciones.length / registrosPorPagina) || 1;
  const indiceUltimoRegistro = paginaActual * registrosPorPagina;
  const indicePrimerRegistro = indiceUltimoRegistro - registrosPorPagina;
  const calificacionesPaginadas = calificaciones.slice(indicePrimerRegistro, indiceUltimoRegistro);

  const cambiarPagina = (nuevaPagina) => {
    if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas) {
      setPaginaActual(nuevaPagina);
    }
  };

  const estadisticasPorPersonal = personal.map((p) => {
    const votosFuncionario = calificaciones.filter((c) => c.personal_id === p.id);
    const totalVotos = votosFuncionario.length;
    
    const sumaPuntos = votosFuncionario.reduce((acc, curr) => acc + curr.calificacion, 0);
    const promedio = totalVotos > 0 ? (sumaPuntos / totalVotos).toFixed(1) : '0.0';

    const desglose = {
      1: votosFuncionario.filter(v => v.calificacion === 1).length,
      2: votosFuncionario.filter(v => v.calificacion === 2).length,
      3: votosFuncionario.filter(v => v.calificacion === 3).length,
      4: votosFuncionario.filter(v => v.calificacion === 4).length,
      5: votosFuncionario.filter(v => v.calificacion === 5).length,
    };

    return {
      ...p,
      totalVotos,
      promedio,
      desglose
    };
  });

  const enviarReporteWhatsApp = () => {
    let mensaje = `📊 *REPORTE ESTADÍSTICO DE ATENCIÓN* 📊\n`;
    mensaje += `*Notaría de Fe Pública Nº 11*\n`;
    mensaje += `📅 Fecha: ${new Date().toLocaleDateString()}\n\n`;

    if (estadisticasPorPersonal.length === 0) {
      mensaje += `No hay personal registrado ni estadísticas disponibles.`;
    } else {
      estadisticasPorPersonal.forEach((stat, index) => {
        mensaje += `${index + 1}. *${stat.nombre}* (${stat.cargo})\n`;
        mensaje += `   • Total Calificaciones: ${stat.totalVotos}\n`;
        mensaje += `   • Promedio: ⭐ ${stat.promedio} / 5.0\n`;
        mensaje += `   • Desglose: 🤩(${stat.desglose[5]}) 😊(${stat.desglose[4]}) 😐(${stat.desglose[3]}) 😕(${stat.desglose[2]}) 😡(${stat.desglose[1]})\n\n`;
      });
    }

    const urlWhatsApp = `https://api.whatsapp.com/send?text=${encodeURIComponent(mensaje)}`;
    window.open(urlWhatsApp, '_blank');
  };

  return (
    <div className="flex-1 p-6 max-w-6xl mx-auto w-full flex flex-col bg-[#0b0b0e] text-[#f8f5fa] gap-6">
      <header className="flex justify-between items-center border-b border-[#3f2257] pb-4">
        <div>
          <h1 className="text-2xl font-bold text-[#f3d5c0] flex items-center gap-2">
            <BarChart2 className="w-8 h-8 text-[#e5c1a7]" /> Panel de Control - Notaría Nº 11
          </h1>
          <p className="text-sm text-[#d8b4fe]">Gestión de turnos en tiempo real y análisis de calificaciones</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => cambiarRuta('/')}
            className="bg-[#3b0764] hover:bg-[#4c1d95] text-[#f3d5c0] border border-[#e5c1a7]/40 px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition cursor-pointer shadow-md"
          >
            <Home className="w-4 h-4 text-[#e5c1a7]" /> Ir a la Calificación
          </button>
          <button
            onClick={logoutAdmin}
            className="bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-800/60 px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition cursor-pointer shadow-md"
          >
            <LogOut className="w-4 h-4" /> Salir
          </button>
        </div>
      </header>


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-[#121216] border border-[#3f2257]/60 p-6 rounded-2xl shadow-xl">
          <h2 className="text-lg font-semibold text-[#f3d5c0] mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-[#e5c1a7]" /> Registrar Funcionario
          </h2>
          <form onSubmit={agregarPersonal} className="space-y-4">
            <div>
              <label className="block text-xs text-[#d8b4fe] mb-1">Nombre Completo:</label>
              <input
                type="text"
                value={nuevoNombre}
                onChange={(e) => setNuevoNombre(e.target.value)}
                placeholder="Ej. Juan Pérez"
                required
                className="w-full bg-[#18181f] border border-[#3f2257] rounded-lg p-2.5 text-[#f8f5fa] text-sm focus:outline-none focus:border-[#e5c1a7]"
              />
            </div>
            <div>
              <label className="block text-xs text-[#d8b4fe] mb-1">Cargo / Función:</label>
              <input
                type="text"
                value={nuevoCargo}
                onChange={(e) => setNuevoCargo(e.target.value)}
                placeholder="Ej. Oficial de Registro"
                required
                className="w-full bg-[#18181f] border border-[#3f2257] rounded-lg p-2.5 text-[#f8f5fa] text-sm focus:outline-none focus:border-[#e5c1a7]"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-[#3b0764] hover:bg-[#4c1d95] text-[#f3d5c0] border border-[#e5c1a7]/40 font-bold py-2.5 rounded-xl transition text-sm shadow-md cursor-pointer"
            >
              Agregar Funcionario
            </button>
          </form>
        </div>

        <div className="bg-[#121216] border border-[#3f2257]/60 p-6 rounded-2xl shadow-xl lg:col-span-2 flex flex-col">
          <h2 className="text-lg font-semibold text-[#f3d5c0] mb-2">Control de Turnos en Tiempo Real</h2>
          <p className="text-xs text-[#d8b4fe] mb-4">Seleccione al funcionario en turno. El cambio se reflejará instantáneamente en la tablet de votación.</p>
          
          <div className="overflow-x-auto flex-1 max-h-64 overflow-y-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[#3f2257] text-[#d8b4fe]">
                <tr>
                  <th className="pb-2 text-center w-16">Activo</th>
                  <th className="pb-2">Nombre</th>
                  <th className="pb-2">Cargo</th>
                  <th className="pb-2 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#3f2257]/30">
                {personal.map((p) => (
                  <tr key={p.id} className={p.en_turno ? 'bg-[#1b1526] border-l-2 border-[#e5c1a7]' : ''}>
                    <td className="py-3 text-center">
                      <input
                        type="radio"
                        name="turno_activo"
                        checked={p.en_turno}
                        onChange={() => seleccionarTurno(p.id)}
                        className="w-4 h-4 text-[#e5c1a7] accent-[#3b0764] cursor-pointer"
                        title="Seleccionar en turno"
                      />
                    </td>
                    <td className="py-3 font-medium text-[#f8f5fa]">
                      {p.nombre} {p.en_turno && <span className="ml-2 text-[10px] bg-[#3b0764] text-[#e5c1a7] px-2 py-0.5 rounded-full border border-[#e5c1a7]/40">En Turno</span>}
                    </td>
                    <td className="py-3 text-[#d8b4fe]">{p.cargo}</td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => eliminarPersonal(p.id)}
                        className="text-rose-300 hover:text-rose-200 text-xs bg-rose-950/60 border border-rose-800/40 p-1.5 rounded-md transition cursor-pointer"
                        title="Eliminar funcionario"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {personal.length === 0 && (
                  <tr>
                    <td colSpan="4" className="text-center py-4 text-[#d8b4fe]/60">No hay personal registrado.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>


      <div className="bg-[#121216] border border-[#3f2257]/60 p-6 rounded-2xl shadow-xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
          <h2 className="text-lg font-semibold text-[#f3d5c0] flex items-center gap-2">
            <PieChart className="w-5 h-5 text-[#e5c1a7]" /> Reporte Estadístico por Funcionario
          </h2>
          
          {!cargandoReportes && personal.length > 0 && (
            <button
              onClick={enviarReporteWhatsApp}
              className="bg-emerald-700 hover:bg-emerald-600 text-white font-medium px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition shadow-md cursor-pointer"
            >
              <Share2 className="w-4 h-4" /> Enviar por WhatsApp
            </button>
          )}
        </div>

        {cargandoReportes ? (
          <p className="text-[#d8b4fe] text-center py-6">Calculando estadísticas...</p>
        ) : personal.length === 0 ? (
          <p className="text-[#d8b4fe] text-center py-6">No hay personal registrado para mostrar estadísticas.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[#3f2257] text-[#d8b4fe]">
                <tr>
                  <th className="pb-3">Funcionario</th>
                  <th className="pb-3 text-center">Total Calificaciones</th>
                  <th className="pb-3 text-center">Promedio</th>
                  <th className="pb-3 text-center">Desglose de Calificaciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#3f2257]/30">
                {estadisticasPorPersonal.map((stat) => (
                  <tr key={stat.id}>
                    <td className="py-3 font-medium text-[#f8f5fa]">
                      {stat.nombre} <span className="text-xs text-[#d8b4fe] block">({stat.cargo})</span>
                    </td>
                    <td className="py-3 text-center font-bold text-[#f3d5c0]">
                      {stat.totalVotos}
                    </td>
                    <td className="py-3 text-center">
                      <div className="inline-flex items-center gap-1 bg-[#1b1526] border border-[#e5c1a7]/30 px-2.5 py-1 rounded-md text-[#f3d5c0] font-bold">
                        <Star className="w-3.5 h-3.5 text-[#e5c1a7] fill-[#e5c1a7]" />
                        {stat.promedio}
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center justify-center gap-3 text-xs">
                        <span className="flex items-center gap-1 bg-[#18181f] px-2 py-1 rounded border border-[#3f2257]" title="Excelente (5)">
                          🤩 <strong className="text-[#f8f5fa]">{stat.desglose[5]}</strong>
                        </span>
                        <span className="flex items-center gap-1 bg-[#18181f] px-2 py-1 rounded border border-[#3f2257]" title="Satisfecho (4)">
                          😊 <strong className="text-[#f8f5fa]">{stat.desglose[4]}</strong>
                        </span>
                        <span className="flex items-center gap-1 bg-[#18181f] px-2 py-1 rounded border border-[#3f2257]" title="Neutral (3)">
                          😐 <strong className="text-[#f8f5fa]">{stat.desglose[3]}</strong>
                        </span>
                        <span className="flex items-center gap-1 bg-[#18181f] px-2 py-1 rounded border border-[#3f2257]" title="Poco satisfecho (2)">
                          😕 <strong className="text-[#f8f5fa]">{stat.desglose[2]}</strong>
                        </span>
                        <span className="flex items-center gap-1 bg-[#18181f] px-2 py-1 rounded border border-[#3f2257]" title="Insatisfecho (1)">
                          😡 <strong className="text-[#f8f5fa]">{stat.desglose[1]}</strong>
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

   
      <div className="bg-[#121216] border border-[#3f2257]/60 p-6 rounded-2xl shadow-xl">
        <h2 className="text-lg font-semibold text-[#f3d5c0] mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-[#e5c1a7]" /> Historial de Votaciones Recientes
        </h2>

        {cargandoReportes ? (
          <p className="text-[#d8b4fe] text-center py-6">Cargando historial...</p>
        ) : calificaciones.length === 0 ? (
          <p className="text-[#d8b4fe] text-center py-6">No hay votos registrados en el sistema todavía.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-[#3f2257] text-[#d8b4fe]">
                  <tr>
                    <th className="pb-3">Fecha y Hora</th>
                    <th className="pb-3">Funcionario Evaluado</th>
                    <th className="pb-3 text-center">Calificación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#3f2257]/30">
                  {calificacionesPaginadas.map((cal) => {
                    const detalle = obtenerDetalleCalificacion(cal.calificacion);
                    const fechaFormateada = new Date(cal.created_at).toLocaleString();
                    return (
                      <tr key={cal.id}>
                        <td className="py-3 text-xs text-[#d8b4fe]">
                          {fechaFormateada}
                        </td>
                        <td className="py-3 font-medium text-[#f8f5fa]">
                          {cal.personal ? `${cal.personal.nombre} (${cal.personal.cargo})` : 'Funcionario eliminado'}
                        </td>
                        <td className="py-3 text-center">
                          <span className="inline-flex items-center gap-1.5 bg-[#18181f] border border-[#3f2257] px-2.5 py-1 rounded-lg text-xs font-medium text-[#f3d5c0]">
                            <span className="text-base">{detalle.emoji}</span> {detalle.texto} ({cal.calificacion})
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>


            <div className="flex justify-between items-center mt-4 pt-4 border-t border-[#3f2257] text-xs">
              <span className="text-[#d8b4fe]">
                Mostrando del <strong className="text-[#f3d5c0]">{indicePrimerRegistro + 1}</strong> al <strong className="text-[#f3d5c0]">{Math.min(indiceUltimoRegistro, calificaciones.length)}</strong> de <strong className="text-[#f3d5c0]">{calificaciones.length}</strong> registros
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => cambiarPagina(paginaActual - 1)}
                  disabled={paginaActual === 1}
                  className="bg-[#3b0764] hover:bg-[#4c1d95] disabled:opacity-40 disabled:cursor-not-allowed text-[#f3d5c0] border border-[#e5c1a7]/40 px-3 py-1.5 rounded-lg flex items-center gap-1 transition cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" /> Anterior
                </button>
                <span className="text-[#f3d5c0] font-medium px-2">
                  Página {paginaActual} de {totalPaginas}
                </span>
                <button
                  onClick={() => cambiarPagina(paginaActual + 1)}
                  disabled={paginaActual === totalPaginas}
                  className="bg-[#3b0764] hover:bg-[#4c1d95] disabled:opacity-40 disabled:cursor-not-allowed text-[#f3d5c0] border border-[#e5c1a7]/40 px-3 py-1.5 rounded-lg flex items-center gap-1 transition cursor-pointer"
                >
                  Siguiente <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}