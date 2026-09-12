import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

// --- CONFIGURACIÓN DE SUPABASE ---
const supabaseUrl = 'https://omjxjtznuligbcyqoxip.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9tanhqdHpudWxpZ2JjeXFveGlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwOTMzMzgsImV4cCI6MjEwNDY2OTMzOH0.aJZWDAhKDPnfn-wVppZwrZE4CpuhLRfG4Y6YIvyDHf4';
const supabase = createClient(supabaseUrl, supabaseKey);

// --- SISTEMA DE DISEÑO: paleta "plano de arquitectura" ---
const PALETTE = {
  ink: '#14161A',
  inkRaised: '#1B1E23',
  paper: '#F7F5F1',
  paperRaised: '#FFFFFF',
  blueprint: '#2F5D8A',
  blueprintLight: '#5B85B3',
  moss: '#4C7A5D',
  mossSoft: '#DCE8DF',
  ochre: '#B08A3E',
  ochreSoft: '#F1E6CE',
  danger: '#B3564A',
  dangerSoft: '#F3DEDA',
};

const FONT_SERIF = "'Fraunces', Georgia, 'Times New Roman', serif";
const FONT_SANS = "'Inter', system-ui, -apple-system, sans-serif";

// ============================================================================
// ESTILOS GLOBALES
// Incluye: reset anti-líneas-blancas, scrollbars ocultas, shimmer de skeletons,
// animaciones de toast, micro-interacciones táctiles y accesibilidad de foco.
// ============================================================================
const GlobalStyles = ({ bgColor }) => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700;800;900&display=swap');

    /* --- Reset anti líneas blancas / overflows --- */
    html, body, #root {
      margin: 0;
      padding: 0;
      width: 100%;
      min-height: 100%;
      background: ${bgColor};
      overscroll-behavior: none;
      -webkit-tap-highlight-color: transparent;
    }
    *, *::before, *::after { box-sizing: border-box; }
    body { transition: background-color 0.3s ease; }

    .mosh-scope, .mosh-scope input, .mosh-scope select, .mosh-scope textarea, .mosh-scope button {
      font-family: ${FONT_SANS};
    }
    .mosh-scope *:focus-visible {
      outline: 2px solid ${PALETTE.blueprint};
      outline-offset: 2px;
      border-radius: 4px;
    }

    /* --- Scrollbars invisibles, scroll funcional intacto --- */
    .mosh-scroll {
      scrollbar-width: none;
      -ms-overflow-style: none;
    }
    .mosh-scroll::-webkit-scrollbar { display: none; width: 0; height: 0; }

    /* --- Sensación de app nativa --- */
    .mosh-scope button {
      -webkit-user-select: none;
      user-select: none;
      -webkit-tap-highlight-color: transparent;
      touch-action: manipulation;
    }
    .mosh-btn { transition: filter 0.15s ease, transform 0.08s ease, box-shadow 0.15s ease; }
    .mosh-btn:hover { filter: brightness(1.08); }
    .mosh-btn:active { transform: scale(0.96); }
    .mosh-card { transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease; }
    .mosh-card:hover { transform: translateY(-3px); }
    .mosh-icon-btn { transition: filter 0.15s ease, border-color 0.15s ease, transform 0.08s ease; }
    .mosh-icon-btn:hover { filter: brightness(1.15); border-color: ${PALETTE.blueprint} !important; }
    .mosh-icon-btn:active { transform: scale(0.92); }
    .mosh-input { transition: border-color 0.15s ease, background 0.15s ease; }
    .mosh-input:focus { border-color: ${PALETTE.blueprint} !important; }
    .mosh-nav-dark:hover { background: rgba(247,245,241,0.06) !important; color: #fff !important; }
    .mosh-nav-light:hover { background: rgba(20,22,26,0.05) !important; color: #14161A !important; }
    .mosh-tab { transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease; min-height: 44px; }
    .mosh-arrow { transition: background 0.15s ease, transform 0.08s ease; }
    .mosh-arrow:hover { background: rgba(0,0,0,0.8) !important; }
    .mosh-arrow:active { transform: translateY(-50%) scale(0.9) !important; }

    /* --- Protección visual de imágenes --- */
    .mosh-img-protect {
      -webkit-touch-callout: none;
      -webkit-user-select: none;
      user-select: none;
      pointer-events: none;
    }

    /* --- Skeleton loaders con brillo animado --- */
    .mosh-skeleton {
      background: linear-gradient(90deg, var(--skel-a) 25%, var(--skel-b) 37%, var(--skel-a) 63%);
      background-size: 400% 100%;
      animation: mosh-shimmer 1.4s ease infinite;
      border-radius: 8px;
    }
    @keyframes mosh-shimmer {
      0% { background-position: 100% 50%; }
      100% { background-position: 0 50%; }
    }

    /* --- Toasts --- */
    .mosh-toast-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 300;
      display: flex;
      flex-direction: column;
      gap: 10px;
      width: min(360px, calc(100vw - 32px));
      pointer-events: none;
    }
    @media (max-width: 768px) {
      .mosh-toast-container { left: 16px; right: 16px; top: 16px; width: auto; }
    }
    .mosh-toast {
      pointer-events: auto;
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 14px 16px;
      border-radius: 12px;
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      box-shadow: 0 16px 34px rgba(0,0,0,0.4);
      border: 1px solid rgba(255,255,255,0.08);
      animation: mosh-toast-in 0.35s cubic-bezier(0.2,0.9,0.3,1.25);
    }
    .mosh-toast.saliendo { animation: mosh-toast-out 0.28s ease forwards; }
    @keyframes mosh-toast-in {
      from { opacity: 0; transform: translateX(24px) scale(0.96); }
      to { opacity: 1; transform: translateX(0) scale(1); }
    }
    @keyframes mosh-toast-out {
      from { opacity: 1; transform: translateX(0) scale(1); }
      to { opacity: 0; transform: translateX(24px) scale(0.94); }
    }

    @media (prefers-reduced-motion: reduce) {
      .mosh-scope * { animation: none !important; transition: none !important; }
    }
  `}</style>
);

// ============================================================================
// COMPONENTE: NOTIFICACIONES FLOTANTES (TOAST)
// ============================================================================
const TOAST_CONFIG = {
  success: { border: PALETTE.moss, bg: 'rgba(76,122,93,0.20)', color: '#9FD4B4', icon: '✓' },
  error: { border: PALETTE.danger, bg: 'rgba(179,86,74,0.20)', color: '#EFA99C', icon: '✕' },
  warning: { border: PALETTE.ochre, bg: 'rgba(176,138,62,0.20)', color: '#F0CD90', icon: '⚠' },
  info: { border: PALETTE.blueprint, bg: 'rgba(47,93,138,0.20)', color: '#9FC1E8', icon: 'ℹ' },
};

function Toast({ mensaje, tipo, saliendo, onClose }) {
  const cfg = TOAST_CONFIG[tipo] || TOAST_CONFIG.info;
  return (
    <div
      className={`mosh-toast${saliendo ? ' saliendo' : ''}`}
      style={{ background: `linear-gradient(135deg, rgba(27,30,35,0.92), rgba(27,30,35,0.86))`, borderLeft: `3px solid ${cfg.border}` }}
    >
      <span style={{ fontSize: '1.05rem', fontWeight: '800', color: cfg.color, lineHeight: '1.3' }}>{cfg.icon}</span>
      <span style={{ flex: 1, fontSize: '0.85rem', fontWeight: '600', color: '#F3F1EC', lineHeight: '1.4' }}>{mensaje}</span>
      <button
        onClick={onClose}
        className="mosh-icon-btn"
        style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '0.9rem', padding: '2px', lineHeight: 1 }}
        aria-label="Cerrar notificación"
      >
        ✕
      </button>
    </div>
  );
}

function ToastContainer({ toasts, onClose }) {
  if (toasts.length === 0) return null;
  return (
    <div className="mosh-toast-container">
      {toasts.map(tst => (
        <Toast key={tst.id} {...tst} onClose={() => onClose(tst.id)} />
      ))}
    </div>
  );
}

// ============================================================================
// COMPONENTE: IMAGEN PROTEGIDA (anti-robo + lazy load + fade-in)
// ============================================================================
function ImagenProtegida({ src, alt, onClick, objectFit = 'contain', background = '#0C0D0F' }) {
  const [cargada, setCargada] = useState(false);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background }}>
      {!cargada && <div className="mosh-skeleton" style={{ position: 'absolute', inset: 0, borderRadius: 0 }} />}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        draggable={false}
        className="mosh-img-protect"
        onLoad={() => setCargada(true)}
        onError={() => setCargada(true)}
        style={{
          width: '100%',
          height: '100%',
          objectFit,
          display: 'block',
          opacity: cargada ? 1 : 0,
          transition: 'opacity 0.6s ease',
        }}
      />
      {/* Capa invisible: absorbe clic (opcionalmente reenviado) y bloquea menú contextual / arrastre / long-press */}
      <div
        onContextMenu={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
        onClick={onClick}
        style={{
          position: 'absolute',
          inset: 0,
          cursor: onClick ? 'zoom-in' : 'default',
          WebkitTouchCallout: 'none',
          background: 'transparent',
        }}
      />
    </div>
  );
}

// ============================================================================
// COMPONENTE: SKELETON LOADER (tarjeta fantasma de ambiente)
// ============================================================================
function SkeletonAmbienteCard({ t, esMovil }) {
  return (
    <div style={{ background: t.surface, borderRadius: '16px', overflow: 'hidden', border: `1px solid ${t.border}`, boxShadow: t.shadow }}>
      <div style={{ padding: '18px 18px 0 18px', display: 'flex', justifyContent: 'space-between' }}>
        <div className="mosh-skeleton" style={{ height: '16px', width: '38%' }} />
        <div className="mosh-skeleton" style={{ height: '16px', width: '18%', borderRadius: '20px' }} />
      </div>
      <div className="mosh-skeleton" style={{ height: esMovil ? '220px' : '360px', margin: '16px 18px 0 18px' }} />
      <div style={{ padding: '20px' }}>
        <div className="mosh-skeleton" style={{ height: '14px', width: '55%', marginBottom: '10px' }} />
        <div className="mosh-skeleton" style={{ height: '12px', width: '85%', marginBottom: '18px' }} />
        <div className="mosh-skeleton" style={{ height: '38px', width: '100%' }} />
      </div>
    </div>
  );
}

function App() {
  const [usuarioLogueado, setUsuarioLogueado] = useState(() => {
    const savedUser = localStorage.getItem('arq_sesion_usuario');
    if (!savedUser || savedUser === 'null' || savedUser === 'undefined') {
      localStorage.clear();
      return '';
    }
    return savedUser;
  });

  const [rolUsuario, setRolUsuario] = useState(() => {
    return localStorage.getItem('arq_sesion_rol') || 'cliente';
  });

  // --- DETECTOR DE PANTALLA MÓVIL ---
  const [esMovil, setEsMovil] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const manejarResize = () => setEsMovil(window.innerWidth <= 768);
    window.addEventListener('resize', manejarResize);
    return () => window.removeEventListener('resize', manejarResize);
  }, []);

  // --- ESTADO DE TEMA (MODO OSCURO / CLARO) ---
  const [modoOscuro, setModoOscuro] = useState(() => {
    const savedTheme = localStorage.getItem('arq_modo_oscuro');
    return savedTheme !== null ? JSON.parse(savedTheme) : true;
  });

  useEffect(() => {
    localStorage.setItem('arq_modo_oscuro', JSON.stringify(modoOscuro));
  }, [modoOscuro]);

  const toggleTema = () => setModoOscuro(!modoOscuro);

  // --- TOKENS DE TEMA DERIVADOS ---
  const t = {
    bg: modoOscuro ? PALETTE.ink : PALETTE.paper,
    surface: modoOscuro ? 'rgba(247,245,241,0.035)' : 'rgba(255,255,255,0.72)',
    surfaceRaised: modoOscuro ? 'rgba(247,245,241,0.055)' : '#FFFFFF',
    field: modoOscuro ? 'rgba(247,245,241,0.05)' : '#FFFFFF',
    border: modoOscuro ? 'rgba(247,245,241,0.10)' : 'rgba(20,22,26,0.09)',
    borderSoft: modoOscuro ? 'rgba(247,245,241,0.06)' : 'rgba(20,22,26,0.05)',
    text: modoOscuro ? '#F3F1EC' : '#181A1D',
    textMuted: modoOscuro ? '#A6A29A' : '#6E6A63',
    textFaint: modoOscuro ? '#726E68' : '#9A968F',
    navClass: modoOscuro ? 'mosh-nav-dark' : 'mosh-nav-light',
    shadow: modoOscuro ? '0 24px 48px rgba(0,0,0,0.45)' : '0 24px 48px rgba(20,22,26,0.07)',
    skelA: modoOscuro ? 'rgba(255,255,255,0.05)' : 'rgba(20,22,26,0.05)',
    skelB: modoOscuro ? 'rgba(255,255,255,0.13)' : 'rgba(20,22,26,0.11)',
  };

  // --- SISTEMA DE NOTIFICACIONES FLOTANTES ---
  const [toasts, setToasts] = useState([]);

  const cerrarToast = useCallback((id) => {
    setToasts(prev => prev.map(tst => (tst.id === id ? { ...tst, saliendo: true } : tst)));
    setTimeout(() => setToasts(prev => prev.filter(tst => tst.id !== id)), 280);
  }, []);

  const mostrarNotificacion = useCallback((mensaje, tipo = 'info', duracion = 3500) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts(prev => [...prev, { id, mensaje, tipo, saliendo: false }]);
    setTimeout(() => cerrarToast(id), duracion);
  }, [cerrarToast]);

  const [inputUser, setInputUser] = useState('');
  const [inputPass, setInputPass] = useState('');
  const [errorLogin, setErrorLogin] = useState('');
  const [cargandoLogin, setCargandoLogin] = useState(false);

  // --- MANEJO DE LOGIN ---
  const manejarLogin = async (e) => {
    e.preventDefault();
    setErrorLogin('');
    setCargandoLogin(true);

    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('username', inputUser.trim())
        .eq('password', inputPass.trim())
        .single();

      if (error || !data) {
        setErrorLogin('Acceso denegado: Usuario o contraseña incorrectos.');
      } else {
        localStorage.setItem('arq_sesion_usuario', data.username);
        localStorage.setItem('arq_sesion_rol', data.rol);
        setUsuarioLogueado(data.username);
        setRolUsuario(data.rol);
        mostrarNotificacion(`Bienvenido, ${data.username}`, 'success');
      }
    } catch (err) {
      setErrorLogin('Error al conectar con la base de datos.');
    } finally {
      setCargandoLogin(false);
    }
  };

  const cerrarSesion = () => {
    localStorage.clear();
    setUsuarioLogueado('');
    setRolUsuario('cliente');
  };

  const [vista, setVista] = useState('proyectos');
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [proyectos, setProyectos] = useState([]);
  const [listaClientes, setListaClientes] = useState([]);
  const [todosLosUsuarios, setTodosLosUsuarios] = useState([]);
  const [cargandoProyectos, setCargandoProyectos] = useState(true);

  // Estado para el Lightbox (Pantalla completa de imagen)
  const [imagenZoom, setImagenZoom] = useState(null);

  const [filtroClienteAdmin, setFiltroClienteAdmin] = useState('');
  const [filtroAmbienteCliente, setFiltroAmbienteCliente] = useState('');
  const [filtroEstadoTab, setFiltroEstadoTab] = useState('todos');

  // Control de índices del carrusel por cada ambiente
  const [indicesCarrusel, setIndicesCarrusel] = useState({});

  const cambiarIndiceCarrusel = (ambiente, direccion, total) => {
    setIndicesCarrusel(prev => {
      const actual = prev[ambiente] || 0;
      let nuevo = actual + direccion;
      if (nuevo < 0) nuevo = total - 1;
      if (nuevo >= total) nuevo = 0;
      return { ...prev, [ambiente]: nuevo };
    });
  };

  const fetchClientes = useCallback(async () => {
    const { data, error } = await supabase
      .from('usuarios')
      .select('username')
      .eq('rol', 'cliente');

    if (!error && data) {
      setListaClientes(data);
    }
  }, []);

  const fetchTodosLosUsuarios = useCallback(async () => {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .order('id', { ascending: true });

    if (!error && data) {
      setTodosLosUsuarios(data);
    }
  }, []);

  const fetchProyectos = useCallback(async (silencioso = false) => {
    if (!silencioso) setCargandoProyectos(true);
    let query = supabase.from('proyectos').select('*').order('id', { ascending: false });

    if (rolUsuario === 'cliente') {
      query = query.eq('cliente', usuarioLogueado);
    } else if (rolUsuario === 'admin' && filtroClienteAdmin) {
      query = query.eq('cliente', filtroClienteAdmin);
    }

    const { data, error } = await query;
    if (!error && data) {
      setProyectos(data);
    }
    if (!silencioso) setCargandoProyectos(false);
  }, [rolUsuario, usuarioLogueado, filtroClienteAdmin]);

  useEffect(() => {
    if (usuarioLogueado) {
      fetchProyectos();
      fetchClientes();
      fetchTodosLosUsuarios();
    }
  }, [usuarioLogueado, fetchProyectos, fetchClientes, fetchTodosLosUsuarios]);

  // --- ESTADOS PARA SUBIR PROYECTOS, AMBIENTES Y VERSIÓN ---
  const [nuevoTitulo, setNuevoTitulo] = useState('');
  const [nuevoClienteSeleccionado, setNuevoClienteSeleccionado] = useState('');
  const [nuevoAmbiente, setNuevoAmbiente] = useState('');
  const [nuevaVersion, setNuevaVersion] = useState('Versión 1');
  const [nuevaImagen, setNuevaImagen] = useState('');
  const [nuevaDesc, setNuevaDesc] = useState('');
  const [guardandoProyecto, setGuardandoProyecto] = useState(false);

  const agregarProyecto = async (e) => {
    e.preventDefault();
    setGuardandoProyecto(true);
    const tituloConVersion = `${nuevoTitulo.trim()} (${nuevaVersion})`;

    const { error } = await supabase.from('proyectos').insert([
      {
        titulo: tituloConVersion,
        cliente: nuevoClienteSeleccionado,
        ambiente: nuevoAmbiente.trim() || 'General',
        imagen: nuevaImagen || 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=800&q=80',
        descripcion: nuevaDesc,
        estado: 'En revisión',
        comentarios: ''
      }
    ]);

    setGuardandoProyecto(false);

    if (error) {
      mostrarNotificacion('Error al guardar el proyecto: ' + error.message, 'error');
    } else {
      mostrarNotificacion('Proyecto y versión asignada con éxito', 'success');
      setNuevoTitulo('');
      setNuevoClienteSeleccionado('');
      setNuevoAmbiente('');
      setNuevaVersion('Versión 1');
      setNuevaImagen('');
      setNuevaDesc('');
      setVista('proyectos');
      fetchProyectos();
    }
  };

  // --- BORRAR PROYECTO INDIVIDUAL ---
  const eliminarProyecto = async (id, titulo) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar este render ("${titulo}")?`)) {
      setProyectos(prev => prev.filter(p => p.id !== id));

      const { error } = await supabase
        .from('proyectos')
        .delete()
        .eq('id', id);

      if (error) {
        mostrarNotificacion('Error al eliminar el render: ' + error.message, 'error');
        fetchProyectos(true);
      } else {
        mostrarNotificacion('Render eliminado correctamente', 'success');
      }
    }
  };

  // --- ESTADOS PARA CREAR USUARIOS ---
  const [nuevoUsuarioNombre, setNuevoUsuarioNombre] = useState('');
  const [nuevoUsuarioPass, setNuevoUsuarioPass] = useState('');
  const [nuevoUsuarioRol, setNuevoUsuarioRol] = useState('cliente');
  const [creandoUsuario, setCreandoUsuario] = useState(false);

  const crearUsuarioNuevo = async (e) => {
    e.preventDefault();
    setCreandoUsuario(true);
    const { error } = await supabase.from('usuarios').insert([
      {
        username: nuevoUsuarioNombre.trim(),
        password: nuevoUsuarioPass.trim(),
        rol: nuevoUsuarioRol
      }
    ]);
    setCreandoUsuario(false);

    if (error) {
      mostrarNotificacion('Error al crear usuario. Es posible que ya exista.', 'error');
    } else {
      mostrarNotificacion(`Usuario "${nuevoUsuarioNombre}" creado con éxito`, 'success');
      setNuevoUsuarioNombre('');
      setNuevoUsuarioPass('');
      setNuevoUsuarioRol('cliente');
      fetchClientes();
      fetchTodosLosUsuarios();
      setVista('proyectos');
    }
  };

  // --- CAMBIAR ROL DE USUARIO ---
  const cambiarRolUsuario = async (id, nuevoRol) => {
    setTodosLosUsuarios(prev => prev.map(u => u.id === id ? { ...u, rol: nuevoRol } : u));

    const { error } = await supabase
      .from('usuarios')
      .update({ rol: nuevoRol })
      .eq('id', id);

    if (error) {
      mostrarNotificacion('Error al actualizar el rol del usuario', 'error');
      fetchTodosLosUsuarios();
    } else {
      mostrarNotificacion('Rol actualizado correctamente', 'success');
      fetchClientes();
    }
  };

  // --- CAMBIAR ESTADO A TODOS LOS RENDERS DE UN AMBIENTE ---
  const cambiarEstadoAmbiente = async (nombreAmbiente, nuevoEstado) => {
    setProyectos(prevProyectos =>
      prevProyectos.map(p => (p.ambiente || 'General') === nombreAmbiente ? { ...p, estado: nuevoEstado } : p)
    );

    const { error } = await supabase
      .from('proyectos')
      .update({ estado: nuevoEstado })
      .eq('ambiente', nombreAmbiente);

    if (error) {
      mostrarNotificacion('Error al actualizar el estado del ambiente: ' + error.message, 'error');
      fetchProyectos(true);
    } else {
      mostrarNotificacion(`Ambiente marcado como "${nuevoEstado}"`, nuevoEstado === 'Aprobado' ? 'success' : 'info');
    }
  };

  // --- ENVIAR COMENTARIO GENERAL AL AMBIENTE ---
  const [textosComentarios, setTextosComentarios] = useState({});

  const enviarComentarioAmbiente = async (nombreAmbiente, rendersAmbiente) => {
    const textoNuevo = textosComentarios[nombreAmbiente];
    if (!textoNuevo || !textoNuevo.trim()) return;

    const renderRef = rendersAmbiente[0];
    if (!renderRef) return;

    const historialActual = renderRef.comentarios ? renderRef.comentarios + '\n---\n' : '';
    const fechaActual = new Date().toLocaleDateString();
    const comentarioCompleto = `${usuarioLogueado} (${fechaActual}) : ${textoNuevo.trim()}`;
    const nuevoHistorial = historialActual + comentarioCompleto;

    setProyectos(prevProyectos =>
      prevProyectos.map(p => (p.ambiente || 'General') === nombreAmbiente ? { ...p, comentarios: nuevoHistorial } : p)
    );
    setTextosComentarios({ ...textosComentarios, [nombreAmbiente]: '' });

    const { error } = await supabase
      .from('proyectos')
      .update({ comentarios: nuevoHistorial })
      .eq('ambiente', nombreAmbiente);

    if (error) {
      mostrarNotificacion('Error al enviar el comentario: ' + error.message, 'error');
      fetchProyectos(true);
    } else {
      mostrarNotificacion('Comentario enviado', 'success');
    }
  };

  // --- FILTRAR PROYECTOS (AMBIENTE + PESTAÑA DE ESTADO) ---
  const proyectosFiltrados = proyectos.filter(p => {
    const cumpleAmbiente = !filtroAmbienteCliente || p.ambiente?.toLowerCase() === filtroAmbienteCliente.toLowerCase();
    const estadoActual = p.estado || 'En revisión';

    let cumpleEstado = true;
    if (filtroEstadoTab === 'aprobados') cumpleEstado = estadoActual === 'Aprobado';
    if (filtroEstadoTab === 'revision') cumpleEstado = estadoActual === 'En revisión';

    return cumpleAmbiente && cumpleEstado;
  });

  const ambientesDisponibles = [...new Set(proyectos.map(p => p.ambiente || 'General'))];

  const ambientesAgrupados = proyectosFiltrados.reduce((acc, p) => {
    const amb = p.ambiente || 'General';
    if (!acc[amb]) acc[amb] = [];
    acc[amb].push(p);
    return acc;
  }, {});

  // Variables CSS de shimmer, inyectadas en el contenedor raíz para que las hereden los skeletons
  const skelVars = { '--skel-a': t.skelA, '--skel-b': t.skelB };

  // Estilo reutilizable para etiquetas de campo en formularios
  const labelStyle = {
    fontSize: '0.68rem', display: 'block', marginBottom: '8px', fontWeight: '700',
    color: t.textMuted, letterSpacing: '0.02em'
  };

  const inputStyle = {
    width: '100%', padding: '13px 15px', borderRadius: '10px', boxSizing: 'border-box',
    border: `1px solid ${t.border}`, background: t.field, color: t.text,
    outline: 'none', fontSize: '0.92rem'
  };

  const panelStyle = {
    background: t.surface, backdropFilter: 'blur(20px)',
    padding: esMovil ? '22px 18px' : '36px', borderRadius: '18px',
    boxShadow: t.shadow, border: `1px solid ${t.border}`
  };

  // --- PANTALLA DE LOGIN ---
  if (!usuarioLogueado) {
    return (
      <div className="mosh-scope" style={{
        position: 'relative', display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center',
        backgroundImage: `url(${process.env.PUBLIC_URL}/LogotipoMosh-06.jpg.jpeg)`,
        backgroundSize: 'cover', backgroundPosition: 'center',
        fontFamily: FONT_SANS, padding: '20px', overflow: 'hidden', ...skelVars
      }}>
        <GlobalStyles bgColor={t.bg} />
        <ToastContainer toasts={toasts} onClose={cerrarToast} />

        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: modoOscuro ? 'rgba(20, 22, 26, 0.82)' : 'rgba(247, 245, 241, 0.86)', backdropFilter: 'blur(14px)' }}></div>

        <button
          onClick={toggleTema}
          className="mosh-icon-btn"
          style={{ position: 'absolute', top: '24px', right: '24px', zIndex: 20, background: modoOscuro ? 'rgba(255,255,255,0.08)' : 'rgba(20,22,26,0.05)', color: t.text, border: `1px solid ${t.border}`, borderRadius: '50%', width: '44px', height: '44px', cursor: 'pointer', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          title="Cambiar modo claro/oscuro"
        >
          {modoOscuro ? '☀︎' : '☾'}
        </button>

        <form onSubmit={manejarLogin} style={{
          position: 'relative', zIndex: 10,
          background: modoOscuro ? 'rgba(27, 30, 35, 0.78)' : 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(28px)',
          border: `1px solid ${t.border}`,
          padding: '52px 34px', borderRadius: '22px', boxShadow: t.shadow,
          textAlign: 'center', width: '100%', maxWidth: '408px', color: t.text, boxSizing: 'border-box'
        }}>
          <div style={{ width: '40px', height: '2px', background: PALETTE.blueprint, margin: '0 auto 22px' }}></div>
          <h1 className="mosh-serif" style={{ margin: '0 0 6px', letterSpacing: '0.04em', fontWeight: '500', fontSize: '2rem', color: t.text }}>MOSH</h1>
          <p style={{ fontSize: '0.78rem', color: t.textMuted, marginBottom: '36px', fontWeight: '500' }}>Arquitectura y Diseño — Portal de clientes</p>

          {errorLogin && (
            <div style={{ backgroundColor: PALETTE.dangerSoft, color: '#7A2E24', padding: '13px 14px', borderRadius: '10px', fontSize: '0.83rem', marginBottom: '22px', fontWeight: '600', textAlign: 'left' }}>
              {errorLogin}
            </div>
          )}

          <div style={{ marginBottom: '18px', textAlign: 'left' }}>
            <label style={labelStyle}>Usuario</label>
            <input
              type="text" placeholder="Ingrese su usuario" value={inputUser} onChange={(e) => setInputUser(e.target.value)} required
              className="mosh-input"
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: '30px', textAlign: 'left' }}>
            <label style={labelStyle}>Contraseña</label>
            <input
              type="password" placeholder="••••••••" value={inputPass} onChange={(e) => setInputPass(e.target.value)} required
              className="mosh-input"
              style={inputStyle}
            />
          </div>

          <button type="submit" disabled={cargandoLogin} className="mosh-btn" style={{ width: '100%', padding: '15px', backgroundColor: PALETTE.blueprint, color: '#F7F5F1', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', fontSize: '0.92rem', boxShadow: '0 10px 24px rgba(47,93,138,0.35)' }}>
            {cargandoLogin ? 'Verificando…' : 'Acceder al portal'}
          </button>
        </form>
      </div>
    );
  }

  // --- INTERFAZ PRINCIPAL RESPONSIVE ---
  return (
    <div
      className="mosh-scope"
      onContextMenu={(e) => e.preventDefault()}
      style={{
        position: 'relative',
        fontFamily: FONT_SANS, minHeight: '100vh',
        backgroundColor: t.bg,
        color: t.text,
        userSelect: 'none', display: 'flex', overflowX: 'hidden',
        ...skelVars
      }}
    >
      <GlobalStyles bgColor={t.bg} />
      <ToastContainer toasts={toasts} onClose={cerrarToast} />

      {/* FONDO GLOBAL CON LOGOTIPO Y BLUR */}
      <div style={{
        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 0,
        backgroundImage: `url(${process.env.PUBLIC_URL}/LogotipoMosh-06.jpg.jpeg)`,
        backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(34px)', opacity: modoOscuro ? 0.12 : 0.06, pointerEvents: 'none'
      }}></div>

      <div style={{
        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 0,
        backgroundColor: modoOscuro ? 'rgba(20, 22, 26, 0.88)' : 'rgba(247, 245, 241, 0.92)', pointerEvents: 'none'
      }}></div>

      {/* LIGHTBOX MODAL */}
      {imagenZoom && (
        <div
          onClick={() => setImagenZoom(null)}
          style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 100,
            backgroundColor: 'rgba(10, 11, 13, 0.92)', backdropFilter: 'blur(10px)',
            display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '15px', boxSizing: 'border-box'
          }}
        >
          <button
            onClick={() => setImagenZoom(null)}
            className="mosh-icon-btn"
            style={{
              position: 'absolute', top: '20px', right: '20px', background: 'rgba(255, 255, 255, 0.12)',
              color: 'white', border: '1px solid rgba(255,255,255,0.18)', borderRadius: '50%', width: '44px', height: '44px', cursor: 'pointer',
              fontSize: '1.1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 101
            }}
          >
            ✕
          </button>
          <div style={{ width: '95vw', height: '85vh', maxWidth: '1100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={(e) => e.stopPropagation()}>
            <ImagenProtegida src={imagenZoom} alt="Vista ampliada" objectFit="contain" background="transparent" />
          </div>
        </div>
      )}

      {/* BOTÓN FLOTANTE MÓVIL (HAMBURGUESA) */}
      <button
        onClick={() => setMenuAbierto(!menuAbierto)}
        className="mosh-icon-btn"
        style={{
          position: 'fixed', top: '16px', left: '16px', zIndex: 50,
          background: modoOscuro ? 'rgba(27, 30, 35, 0.92)' : 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(10px)', color: t.text,
          border: `1px solid ${t.border}`,
          borderRadius: '10px', width: '44px', height: '44px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.15rem',
          boxShadow: '0 6px 16px rgba(0,0,0,0.12)'
        }}
        title="Menú de navegación"
      >
        {menuAbierto ? '✕' : '☰'}
      </button>

      {/* SIDEBAR LATERAL IZQUIERDO */}
      <aside style={{
        position: 'fixed', top: 0, left: menuAbierto ? 0 : '-284px', width: '284px', height: '100vh', zIndex: 40,
        backgroundColor: modoOscuro ? 'rgba(23, 25, 30, 0.97)' : 'rgba(255, 255, 255, 0.98)',
        backdropFilter: 'blur(22px)', borderRight: `1px solid ${t.border}`,
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '32px 20px', boxSizing: 'border-box',
        transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: menuAbierto ? '14px 0 36px rgba(0,0,0,0.35)' : 'none'
      }}>
        <div>
          <div style={{ marginBottom: '38px', paddingLeft: '46px' }}>
            <h2 className="mosh-serif" style={{ fontSize: '1.35rem', margin: 0, letterSpacing: '0.03em', fontWeight: '500', color: t.text }}>MOSH</h2>
            <p style={{ fontSize: '0.65rem', color: t.textMuted, margin: '5px 0 0 0', fontWeight: '600' }}>Arquitectura y Diseño</p>
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: '700', color: t.textFaint, paddingLeft: '12px', marginBottom: '8px' }}>Navegación</span>

            <button onClick={() => { setVista('proyectos'); setMenuAbierto(false); }} className={`mosh-nav-btn ${t.navClass}`} style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', minHeight: '44px', padding: '12px 14px', background: vista === 'proyectos' ? (modoOscuro ? 'rgba(255,255,255,0.08)' : 'rgba(20,22,26,0.05)') : 'transparent', color: vista === 'proyectos' ? PALETTE.blueprintLight : t.textMuted, border: 'none', borderLeft: vista === 'proyectos' ? `2px solid ${PALETTE.blueprint}` : '2px solid transparent', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.88rem', textAlign: 'left' }}>
              Ver proyectos
            </button>

            <button onClick={() => { setVista('timeline'); setMenuAbierto(false); }} className={`mosh-nav-btn ${t.navClass}`} style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', minHeight: '44px', padding: '12px 14px', background: vista === 'timeline' ? (modoOscuro ? 'rgba(255,255,255,0.08)' : 'rgba(20,22,26,0.05)') : 'transparent', color: vista === 'timeline' ? PALETTE.blueprintLight : t.textMuted, border: 'none', borderLeft: vista === 'timeline' ? `2px solid ${PALETTE.blueprint}` : '2px solid transparent', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.88rem', textAlign: 'left' }}>
              Actividad / Timeline
            </button>

            {rolUsuario === 'admin' && (
              <>
                <span style={{ fontSize: '0.65rem', fontWeight: '700', color: t.textFaint, paddingLeft: '12px', margin: '18px 0 8px 0' }}>Panel de control</span>

                <button onClick={() => { setVista('subir'); setMenuAbierto(false); }} className={`mosh-nav-btn ${t.navClass}`} style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', minHeight: '44px', padding: '12px 14px', background: vista === 'subir' ? (modoOscuro ? 'rgba(255,255,255,0.08)' : 'rgba(20,22,26,0.05)') : 'transparent', color: vista === 'subir' ? PALETTE.blueprintLight : t.textMuted, border: 'none', borderLeft: vista === 'subir' ? `2px solid ${PALETTE.blueprint}` : '2px solid transparent', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.88rem', textAlign: 'left' }}>
                  Subir nuevo render
                </button>

                <button onClick={() => { setVista('crear_usuario'); setMenuAbierto(false); }} className={`mosh-nav-btn ${t.navClass}`} style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', minHeight: '44px', padding: '12px 14px', background: vista === 'crear_usuario' ? (modoOscuro ? 'rgba(255,255,255,0.08)' : 'rgba(20,22,26,0.05)') : 'transparent', color: vista === 'crear_usuario' ? PALETTE.blueprintLight : t.textMuted, border: 'none', borderLeft: vista === 'crear_usuario' ? `2px solid ${PALETTE.blueprint}` : '2px solid transparent', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.88rem', textAlign: 'left' }}>
                  Crear cuenta
                </button>

                <button onClick={() => { setVista('gestionar_usuarios'); setMenuAbierto(false); }} className={`mosh-nav-btn ${t.navClass}`} style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', minHeight: '44px', padding: '12px 14px', background: vista === 'gestionar_usuarios' ? (modoOscuro ? 'rgba(255,255,255,0.08)' : 'rgba(20,22,26,0.05)') : 'transparent', color: vista === 'gestionar_usuarios' ? PALETTE.blueprintLight : t.textMuted, border: 'none', borderLeft: vista === 'gestionar_usuarios' ? `2px solid ${PALETTE.blueprint}` : '2px solid transparent', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.88rem', textAlign: 'left' }}>
                  Gestionar usuarios
                </button>
              </>
            )}
          </nav>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', borderTop: `1px solid ${t.borderSoft}`, paddingTop: '20px' }}>
          <button
            onClick={toggleTema}
            className={`mosh-nav-btn ${t.navClass}`}
            style={{ width: '100%', minHeight: '44px', padding: '10px 14px', background: modoOscuro ? 'rgba(255,255,255,0.05)' : 'rgba(20,22,26,0.03)', color: t.text, border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.82rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            {modoOscuro ? '☀︎ Modo claro' : '☾ Modo oscuro'}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: modoOscuro ? 'rgba(0,0,0,0.22)' : 'rgba(20,22,26,0.03)', padding: '10px 14px', borderRadius: '10px' }}>
            <div style={{ overflow: 'hidden' }}>
              <span style={{ display: 'block', fontSize: '0.84rem', fontWeight: '700', color: t.text, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{usuarioLogueado}</span>
              <span style={{ display: 'block', fontSize: '0.68rem', color: t.textMuted, fontWeight: '600' }}>{rolUsuario === 'admin' ? 'Administrador' : 'Cliente'}</span>
            </div>
            <button onClick={cerrarSesion} className="mosh-btn" style={{ background: PALETTE.danger, color: 'white', border: 'none', borderRadius: '7px', padding: '9px 12px', minHeight: '38px', cursor: 'pointer', fontWeight: '700', fontSize: '0.72rem' }} title="Cerrar Sesión">Salir</button>
          </div>
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL ADAPTADO A MÓVIL */}
      <main className="mosh-scroll" style={{ position: 'relative', zIndex: 10, flex: 1, padding: esMovil ? '78px 14px 40px 14px' : '40px 30px 40px 80px', boxSizing: 'border-box', overflowY: 'auto', maxHeight: '100vh', width: '100%' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>

          {/* VISTA: TIMELINE / HISTORIAL DE ACTIVIDAD */}
          {vista === 'timeline' ? (
            <div style={panelStyle}>
              <h3 className="mosh-serif" style={{ marginTop: 0, color: t.text, fontSize: '1.5rem', fontWeight: '500' }}>Historial y línea de tiempo del proyecto</h3>
              <p style={{ fontSize: '0.85rem', color: t.textMuted, marginBottom: '26px' }}>Registro transparente de avances, estados y comentarios recientes en los ambientes.</p>

              {cargandoProyectos ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {[1, 2, 3].map(i => (
                    <div key={i} className="mosh-skeleton" style={{ height: '92px', borderRadius: '10px' }} />
                  ))}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {proyectos.map((p, idx) => (
                    <div key={idx} style={{ padding: '16px 20px', background: modoOscuro ? 'rgba(255,255,255,0.025)' : 'rgba(20,22,26,0.02)', borderRadius: '10px', borderLeft: `3px solid ${p.estado === 'Aprobado' ? PALETTE.moss : PALETTE.ochre}`, border: `1px solid ${t.borderSoft}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', flexWrap: 'wrap', gap: '6px' }}>
                        <span style={{ fontWeight: '700', color: t.text, fontSize: '0.92rem' }}>Ambiente: {p.ambiente || 'General'} ({p.titulo})</span>
                        <span style={{ fontSize: '0.72rem', fontWeight: '700', color: p.estado === 'Aprobado' ? PALETTE.moss : PALETTE.ochre }}>{p.estado}</span>
                      </div>
                      <p style={{ margin: '4px 0 8px 0', fontSize: '0.84rem', color: t.textMuted }}>Cliente asignado: <strong style={{ color: t.text }}>{p.cliente}</strong></p>
                      {p.comentarios && (
                        <div style={{ fontSize: '0.8rem', background: modoOscuro ? 'rgba(0,0,0,0.25)' : '#F3F1EC', padding: '10px 12px', borderRadius: '8px', color: t.textMuted, whiteSpace: 'pre-line' }}>
                          <strong style={{ color: t.text }}>Última retroalimentación:</strong><br />{p.comentarios}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : rolUsuario === 'admin' && vista === 'gestionar_usuarios' ? (
            <div style={panelStyle}>
              <h3 className="mosh-serif" style={{ marginTop: 0, color: t.text, fontSize: '1.5rem', fontWeight: '500' }}>Gestión de usuarios y roles</h3>
              <p style={{ fontSize: '0.85rem', color: t.textMuted, marginBottom: '26px' }}>Modifica el rol de cualquier usuario al instante usando el menú desplegable.</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {todosLosUsuarios.map(u => (
                  <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: modoOscuro ? 'rgba(255,255,255,0.025)' : 'rgba(20,22,26,0.02)', borderRadius: '10px', border: `1px solid ${t.borderSoft}`, flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <span style={{ fontWeight: '700', fontSize: '0.98rem', color: t.text }}>{u.username}</span>
                      <span style={{ display: 'block', fontSize: '0.72rem', color: t.textFaint, marginTop: '2px' }}>Contraseña: {u.password}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '0.78rem', color: t.textMuted, fontWeight: '600' }}>Rol:</span>
                      <select
                        value={u.rol}
                        onChange={(e) => cambiarRolUsuario(u.id, e.target.value)}
                        className="mosh-input"
                        style={{ padding: '8px 12px', borderRadius: '8px', border: `1px solid ${t.border}`, backgroundColor: t.field, fontWeight: '600', color: t.text, outline: 'none' }}
                      >
                        <option value="cliente">Cliente</option>
                        <option value="admin">Administrador</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : rolUsuario === 'admin' && vista === 'subir' ? (
            <form onSubmit={agregarProyecto} style={panelStyle}>
              <h3 className="mosh-serif" style={{ marginTop: 0, color: t.text, fontSize: '1.5rem', fontWeight: '500' }}>Subir render, versión y ambiente</h3>
              <p style={{ fontSize: '0.85rem', color: t.textMuted, marginBottom: '26px' }}>Carga el contenido visual, selecciona su versión y asigna el ambiente.</p>

              <div style={{ marginBottom: '18px' }}>
                <label style={labelStyle}>Título del proyecto / diseño</label>
                <input type="text" placeholder="Ej. Casa de Playa - Residencia" value={nuevoTitulo} onChange={(e) => setNuevoTitulo(e.target.value)} required className="mosh-input" style={inputStyle} />
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={labelStyle}>Versión de entrega</label>
                <select
                  value={nuevaVersion}
                  onChange={(e) => setNuevaVersion(e.target.value)}
                  required
                  className="mosh-input"
                  style={{ ...inputStyle, fontWeight: '600' }}
                >
                  <option value="Versión 1">Versión 1</option>
                  <option value="Versión 2">Versión 2</option>
                  <option value="Versión 3">Versión 3</option>
                  <option value="Revisión Final">Revisión Final</option>
                </select>
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={labelStyle}>Seleccionar cliente destino</label>
                <select
                  value={nuevoClienteSeleccionado}
                  onChange={(e) => setNuevoClienteSeleccionado(e.target.value)}
                  required
                  className="mosh-input"
                  style={{ ...inputStyle, fontWeight: '600' }}
                >
                  <option value="">— Selecciona un cliente —</option>
                  {listaClientes.map((c, index) => (
                    <option key={index} value={c.username}>{c.username}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={labelStyle}>Ambiente (creación libre)</label>
                <input
                  type="text"
                  placeholder="Ej. Sala, Cocina, Cuarto 1, Terraza..."
                  value={nuevoAmbiente}
                  onChange={(e) => setNuevoAmbiente(e.target.value)}
                  required
                  className="mosh-input"
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={labelStyle}>URL de la imagen / render</label>
                <input type="text" placeholder="https://..." value={nuevaImagen} onChange={(e) => setNuevaImagen(e.target.value)} required className="mosh-input" style={inputStyle} />
              </div>

              <div style={{ marginBottom: '26px' }}>
                <label style={labelStyle}>Descripción</label>
                <textarea value={nuevaDesc} onChange={(e) => setNuevaDesc(e.target.value)} rows="3" className="mosh-input" style={{ ...inputStyle, resize: 'vertical', fontFamily: FONT_SANS }}></textarea>
              </div>

              <button type="submit" disabled={guardandoProyecto} className="mosh-btn" style={{ backgroundColor: PALETTE.blueprint, color: '#F7F5F1', padding: '15px 24px', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', fontSize: '0.92rem', boxShadow: '0 10px 24px rgba(47,93,138,0.3)', width: '100%', opacity: guardandoProyecto ? 0.75 : 1 }}>
                {guardandoProyecto ? 'Guardando…' : 'Guardar y asignar render'}
              </button>
            </form>
          ) : rolUsuario === 'admin' && vista === 'crear_usuario' ? (
            <form onSubmit={crearUsuarioNuevo} style={panelStyle}>
              <h3 className="mosh-serif" style={{ marginTop: 0, color: t.text, fontSize: '1.5rem', fontWeight: '500' }}>Crear nuevo usuario o cliente</h3>
              <p style={{ fontSize: '0.85rem', color: t.textMuted, marginBottom: '26px' }}>Registra una nueva cuenta de acceso para un cliente o administrador.</p>

              <div style={{ marginBottom: '18px' }}>
                <label style={labelStyle}>Nombre de usuario</label>
                <input type="text" placeholder="Ej. Carlos Pérez" value={nuevoUsuarioNombre} onChange={(e) => setNuevoUsuarioNombre(e.target.value)} required className="mosh-input" style={inputStyle} />
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={labelStyle}>Contraseña</label>
                <input type="text" placeholder="Ej. CLAVE123" value={nuevoUsuarioPass} onChange={(e) => setNuevoUsuarioPass(e.target.value)} required className="mosh-input" style={inputStyle} />
              </div>

              <div style={{ marginBottom: '26px' }}>
                <label style={labelStyle}>Rol inicial</label>
                <select value={nuevoUsuarioRol} onChange={(e) => setNuevoUsuarioRol(e.target.value)} className="mosh-input" style={{ ...inputStyle, fontWeight: '600' }}>
                  <option value="cliente">Cliente</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              <button type="submit" disabled={creandoUsuario} className="mosh-btn" style={{ backgroundColor: PALETTE.blueprint, color: '#F7F5F1', padding: '15px 24px', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', fontSize: '0.92rem', boxShadow: '0 10px 24px rgba(47,93,138,0.3)', width: '100%', opacity: creandoUsuario ? 0.75 : 1 }}>
                {creandoUsuario ? 'Registrando…' : 'Registrar en Supabase'}
              </button>
            </form>
          ) : (
            /* VISTA: LISTA DE AMBIENTES CON PESTAÑAS DE ESTADO Y FILTROS */
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: esMovil ? 'flex-start' : 'center', marginBottom: '22px', flexDirection: esMovil ? 'column' : 'row', gap: '16px' }}>
                <div>
                  <h2 className="mosh-serif" style={{ color: t.text, margin: '0 0 5px 0', fontSize: esMovil ? '1.5rem' : '1.8rem', fontWeight: '500' }}>
                    {rolUsuario === 'admin' ? 'Todos los ambientes y renders' : 'Tus ambientes asignados'}
                  </h2>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: t.textMuted }}>Filtra por estado o ambiente y haz clic en las imágenes para ampliar.</p>
                </div>

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', width: esMovil ? '100%' : 'auto' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: t.surface, backdropFilter: 'blur(10px)', padding: '8px 14px', borderRadius: '10px', border: `1px solid ${t.border}`, flex: esMovil ? '1' : 'unset' }}>
                    <span style={{ fontSize: '0.68rem', fontWeight: '700', color: t.textMuted }}>Ambiente:</span>
                    <select
                      value={filtroAmbienteCliente}
                      onChange={(e) => setFiltroAmbienteCliente(e.target.value)}
                      className="mosh-input"
                      style={{ padding: '6px 10px', borderRadius: '7px', border: 'none', backgroundColor: modoOscuro ? 'rgba(255,255,255,0.07)' : 'rgba(20,22,26,0.04)', fontWeight: '700', color: t.text, outline: 'none', fontSize: '0.84rem', flex: esMovil ? '1' : 'unset' }}
                    >
                      <option value="">Todos</option>
                      {ambientesDisponibles.map((amb, index) => (
                        <option key={index} value={amb}>{amb}</option>
                      ))}
                    </select>
                  </div>

                  {rolUsuario === 'admin' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: t.surface, backdropFilter: 'blur(10px)', padding: '8px 14px', borderRadius: '10px', border: `1px solid ${t.border}`, flex: esMovil ? '1' : 'unset' }}>
                      <span style={{ fontSize: '0.68rem', fontWeight: '700', color: t.textMuted }}>Cliente:</span>
                      <select
                        value={filtroClienteAdmin}
                        onChange={(e) => setFiltroClienteAdmin(e.target.value)}
                        className="mosh-input"
                        style={{ padding: '6px 10px', borderRadius: '7px', border: 'none', backgroundColor: modoOscuro ? 'rgba(255,255,255,0.07)' : 'rgba(20,22,26,0.04)', fontWeight: '700', color: t.text, outline: 'none', fontSize: '0.84rem', flex: esMovil ? '1' : 'unset' }}
                      >
                        <option value="">Todos</option>
                        {listaClientes.map((c, index) => (
                          <option key={index} value={c.username}>{c.username}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* PESTAÑAS DE FILTRO RÁPIDO POR ESTADO */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '26px', overflowX: 'auto', paddingBottom: '4px', borderBottom: `1px solid ${t.borderSoft}` }}>
                <button
                  onClick={() => setFiltroEstadoTab('todos')}
                  className="mosh-tab"
                  style={{ padding: '10px 6px', borderRadius: '0', border: 'none', borderBottom: filtroEstadoTab === 'todos' ? `2px solid ${PALETTE.blueprint}` : '2px solid transparent', background: 'transparent', color: filtroEstadoTab === 'todos' ? t.text : t.textMuted, fontWeight: '700', fontSize: '0.82rem', cursor: 'pointer', whiteSpace: 'nowrap', marginRight: '10px' }}
                >
                  Todos
                </button>
                <button
                  onClick={() => setFiltroEstadoTab('revision')}
                  className="mosh-tab"
                  style={{ padding: '10px 6px', borderRadius: '0', border: 'none', borderBottom: filtroEstadoTab === 'revision' ? `2px solid ${PALETTE.ochre}` : '2px solid transparent', background: 'transparent', color: filtroEstadoTab === 'revision' ? PALETTE.ochre : t.textMuted, fontWeight: '700', fontSize: '0.82rem', cursor: 'pointer', whiteSpace: 'nowrap', marginRight: '10px' }}
                >
                  En revisión
                </button>
                <button
                  onClick={() => setFiltroEstadoTab('aprobados')}
                  className="mosh-tab"
                  style={{ padding: '10px 6px', borderRadius: '0', border: 'none', borderBottom: filtroEstadoTab === 'aprobados' ? `2px solid ${PALETTE.moss}` : '2px solid transparent', background: 'transparent', color: filtroEstadoTab === 'aprobados' ? PALETTE.moss : t.textMuted, fontWeight: '700', fontSize: '0.82rem', cursor: 'pointer', whiteSpace: 'nowrap' }}
                >
                  Aprobados
                </button>
              </div>

              {cargandoProyectos ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '28px' }}>
                  <SkeletonAmbienteCard t={t} esMovil={esMovil} />
                  <SkeletonAmbienteCard t={t} esMovil={esMovil} />
                </div>
              ) : Object.keys(ambientesAgrupados).length === 0 ? (
                <p style={{ textAlign: 'center', color: t.textMuted, padding: '40px 0' }}>No hay ambientes encontrados para este filtro.</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '28px' }}>
                  {Object.entries(ambientesAgrupados).map(([nombreAmbiente, listaRenders]) => {
                    const indiceActual = indicesCarrusel[nombreAmbiente] || 0;
                    const renderActual = listaRenders[indiceActual] || listaRenders[0];
                    const estadoAmbiente = renderActual.estado || 'En revisión';

                    return (
                      <div key={nombreAmbiente} className="mosh-card" style={{ background: t.surface, backdropFilter: 'blur(20px)', borderRadius: '16px', overflow: 'hidden', boxShadow: t.shadow, border: `1px solid ${t.border}` }}>

                        {/* CABECERA DE AMBIENTE */}
                        <div style={{ padding: '18px 18px 0 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <span className="mosh-serif" style={{ fontSize: '1.05rem', color: t.text, fontWeight: '500' }}>
                              {nombreAmbiente}
                            </span>
                            <span style={{ fontSize: '0.72rem', color: t.textFaint, fontWeight: '600' }}>
                              · Cliente: {renderActual.cliente}
                            </span>
                          </div>

                          <span style={{
                            fontSize: '0.72rem', padding: '5px 12px', borderRadius: '20px', fontWeight: '700',
                            backgroundColor: estadoAmbiente === 'Aprobado' ? (modoOscuro ? 'rgba(76,122,93,0.22)' : PALETTE.mossSoft) : (modoOscuro ? 'rgba(176,138,62,0.2)' : PALETTE.ochreSoft),
                            color: estadoAmbiente === 'Aprobado' ? (modoOscuro ? '#8FC3A4' : '#2F5940') : (modoOscuro ? '#E0BD7C' : '#7A5E27')
                          }}>
                            {estadoAmbiente}
                          </span>
                        </div>

                        {/* CONTENEDOR DEL CARRUSEL CON PROTECCIÓN, LAZY LOAD Y ETIQUETA DE VERSIÓN */}
                        <div style={{ position: 'relative', width: '100%', height: esMovil ? '260px' : '400px', backgroundColor: '#0C0D0F', marginTop: '14px' }}>
                          <ImagenProtegida
                            src={renderActual.imagen}
                            alt={renderActual.titulo}
                            onClick={() => setImagenZoom(renderActual.imagen)}
                            objectFit="contain"
                          />

                          {/* ETIQUETA FLOTANTE DE VERSIÓN */}
                          <div style={{
                            position: 'absolute', top: '12px', right: '12px', zIndex: 10, pointerEvents: 'none',
                            background: 'rgba(0, 0, 0, 0.72)', backdropFilter: 'blur(8px)', padding: '5px 12px', borderRadius: '7px',
                            color: PALETTE.blueprintLight, fontSize: '0.72rem', fontWeight: '700', border: '1px solid rgba(255,255,255,0.12)'
                          }}>
                            {renderActual.titulo.includes('(') ? renderActual.titulo.match(/\(([^)]+)\)$/)?.[1] || 'Versión 1' : 'Versión 1'}
                          </div>

                          <div style={{
                            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(-25deg)',
                            color: 'rgba(255, 255, 255, 0.22)', fontSize: esMovil ? '1rem' : '1.4rem', fontWeight: '700', textAlign: 'center',
                            pointerEvents: 'none', zIndex: '3', width: '100%', textShadow: '0 2px 8px rgba(0,0,0,0.8)', lineHeight: '1.4', letterSpacing: '1px', fontFamily: FONT_SERIF
                          }}>
                            MOSH<br />
                            MOSH Arquitectura y Diseño<br />
                            <span style={{ fontSize: '0.72rem', fontWeight: '600', fontFamily: FONT_SANS }}>Visualizado por: {usuarioLogueado}</span>
                          </div>

                          {listaRenders.length > 1 && (
                            <>
                              <button
                                onClick={() => cambiarIndiceCarrusel(nombreAmbiente, -1, listaRenders.length)}
                                className="mosh-arrow"
                                style={{
                                  position: 'absolute', top: '50%', left: '10px', transform: 'translateY(-50%)', zIndex: 10,
                                  background: 'rgba(0, 0, 0, 0.55)', color: 'white', border: '1px solid rgba(255,255,255,0.18)',
                                  borderRadius: '50%', width: '38px', height: '38px', cursor: 'pointer', fontSize: '0.95rem',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}
                              >
                                ❮
                              </button>

                              <button
                                onClick={() => cambiarIndiceCarrusel(nombreAmbiente, 1, listaRenders.length)}
                                className="mosh-arrow"
                                style={{
                                  position: 'absolute', top: '50%', right: '10px', transform: 'translateY(-50%)', zIndex: 10,
                                  background: 'rgba(0, 0, 0, 0.55)', color: 'white', border: '1px solid rgba(255,255,255,0.18)',
                                  borderRadius: '50%', width: '38px', height: '38px', cursor: 'pointer', fontSize: '0.95rem',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}
                              >
                                ❯
                              </button>

                              <div style={{
                                position: 'absolute', bottom: '12px', left: '50%', transform: 'translateX(-50%)', zIndex: 10, pointerEvents: 'none',
                                background: 'rgba(0, 0, 0, 0.72)', backdropFilter: 'blur(8px)', padding: '5px 12px', borderRadius: '20px',
                                color: 'white', fontSize: '0.72rem', fontWeight: '600', border: '1px solid rgba(255,255,255,0.12)',
                                display: 'flex', gap: '6px', alignItems: 'center'
                              }}>
                                <span>{renderActual.titulo}</span>
                                <span style={{ opacity: 0.5 }}>·</span>
                                <span style={{ color: PALETTE.blueprintLight }}>{indiceActual + 1} / {listaRenders.length}</span>
                              </div>
                            </>
                          )}
                        </div>

                        {/* DETALLES Y ACCIONES */}
                        <div style={{ padding: esMovil ? '18px' : '26px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px', gap: '10px', flexDirection: esMovil ? 'column' : 'row' }}>
                            <div>
                              <h3 style={{ margin: '0 0 6px 0', color: t.text, fontSize: '1.05rem', fontWeight: '700' }}>{renderActual.titulo}</h3>
                              <p style={{ margin: 0, fontSize: '0.85rem', color: t.textMuted, lineHeight: '1.55' }}>{renderActual.descripcion || 'Sin descripción adicional para este diseño.'}</p>
                            </div>

                            {rolUsuario === 'admin' && (
                              <button
                                onClick={() => eliminarProyecto(renderActual.id, renderActual.titulo)}
                                title="Eliminar este render específico"
                                className="mosh-btn"
                                style={{ backgroundColor: PALETTE.dangerSoft, color: '#8A392E', border: 'none', borderRadius: '8px', padding: '10px 12px', minHeight: '40px', cursor: 'pointer', fontSize: '0.74rem', fontWeight: '700', width: esMovil ? '100%' : 'auto' }}
                              >
                                Borrar render actual
                              </button>
                            )}
                          </div>

                          <div style={{ display: 'flex', gap: '8px', marginBottom: '22px', background: modoOscuro ? 'rgba(0,0,0,0.18)' : 'rgba(20,22,26,0.02)', padding: '12px', borderRadius: '10px', border: `1px solid ${t.borderSoft}`, flexDirection: esMovil ? 'column' : 'row', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.72rem', fontWeight: '700', color: t.textMuted, width: esMovil ? '100%' : 'auto' }}>Estado:</span>
                            <div style={{ display: 'flex', gap: '8px', width: esMovil ? '100%' : 'auto' }}>
                              <button
                                onClick={() => cambiarEstadoAmbiente(nombreAmbiente, 'Aprobado')}
                                className="mosh-btn"
                                style={{ padding: '10px 12px', minHeight: '40px', background: PALETTE.moss, color: 'white', border: 'none', borderRadius: '7px', fontWeight: '700', cursor: 'pointer', fontSize: '0.78rem', flex: 1 }}
                              >
                                Aprobar
                              </button>
                              <button
                                onClick={() => cambiarEstadoAmbiente(nombreAmbiente, 'En revisión')}
                                className="mosh-btn"
                                style={{ padding: '10px 12px', minHeight: '40px', background: PALETTE.ochre, color: 'white', border: 'none', borderRadius: '7px', fontWeight: '700', cursor: 'pointer', fontSize: '0.78rem', flex: 1 }}
                              >
                                En revisión
                              </button>
                            </div>
                          </div>

                          <div style={{ borderTop: `1px solid ${t.borderSoft}`, paddingTop: '18px' }}>
                            <h4 style={{ margin: '0 0 10px 0', fontSize: '0.76rem', color: t.textMuted, fontWeight: '700' }}>Comentarios · {nombreAmbiente}</h4>

                            <div className="mosh-scroll" style={{ background: modoOscuro ? 'rgba(0,0,0,0.2)' : '#F3F1EC', padding: '12px', borderRadius: '10px', minHeight: '40px', maxHeight: '110px', overflowY: 'auto', marginBottom: '12px', fontSize: '0.8rem', whiteSpace: 'pre-line', border: `1px solid ${t.borderSoft}`, color: t.text }}>
                              {renderActual.comentarios ? renderActual.comentarios : <span style={{ color: t.textFaint }}>No hay comentarios aún. Deja tus observaciones abajo.</span>}
                            </div>

                            <div style={{ display: 'flex', gap: '8px', flexDirection: esMovil ? 'column' : 'row' }}>
                              <input
                                type="text"
                                placeholder={`Comentar en ${nombreAmbiente}...`}
                                value={textosComentarios[nombreAmbiente] || ''}
                                onChange={(e) => setTextosComentarios({ ...textosComentarios, [nombreAmbiente]: e.target.value })}
                                className="mosh-input"
                                style={{ flex: 1, padding: '12px 14px', minHeight: '44px', borderRadius: '9px', border: `1px solid ${t.border}`, background: t.field, color: t.text, fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
                              />
                              <button
                                onClick={() => enviarComentarioAmbiente(nombreAmbiente, listaRenders)}
                                className="mosh-btn"
                                style={{ padding: '12px 20px', minHeight: '44px', background: PALETTE.blueprint, color: '#F7F5F1', border: 'none', borderRadius: '9px', fontWeight: '700', cursor: 'pointer', fontSize: '0.84rem', width: esMovil ? '100%' : 'auto' }}
                              >
                                Enviar
                              </button>
                            </div>
                          </div>

                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;