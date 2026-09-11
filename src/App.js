import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

// --- CONFIGURACIÓN DE SUPABASE ---
const supabaseUrl = 'https://omjxjtznuligbcyqoxip.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9tanhqdHpudWxpZ2JjeXFveGlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwOTMzMzgsImV4cCI6MjEwNDY2OTMzOH0.aJZWDAhKDPnfn-wVppZwrZE4CpuhLRfG4Y6YIvyDHf4';
const supabase = createClient(supabaseUrl, supabaseKey);

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

  // --- ESTADO DE TEMA (MODO OSCURO / CLARO) ---
  const [modoOscuro, setModoOscuro] = useState(() => {
    const savedTheme = localStorage.getItem('arq_modo_oscuro');
    return savedTheme !== null ? JSON.parse(savedTheme) : true; 
  });

  useEffect(() => {
    localStorage.setItem('arq_modo_oscuro', JSON.stringify(modoOscuro));
  }, [modoOscuro]);

  const toggleTema = () => setModoOscuro(!modoOscuro);
  
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
  const [menuAbierto, setMenuAbierto] = useState(false); // Estado para abrir/cerrar sidebar en celular
  const [proyectos, setProyectos] = useState([]);
  const [listaClientes, setListaClientes] = useState([]);
  const [todosLosUsuarios, setTodosLosUsuarios] = useState([]);
  const [cargandoProyectos, setCargandoProyectos] = useState(true);

  const [filtroClienteAdmin, setFiltroClienteAdmin] = useState('');
  const [filtroAmbienteCliente, setFiltroAmbienteCliente] = useState('');

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

  // --- ESTADOS PARA SUBIR PROYECTOS Y AMBIENTES ---
  const [nuevoTitulo, setNuevoTitulo] = useState('');
  const [nuevoClienteSeleccionado, setNuevoClienteSeleccionado] = useState('');
  const [nuevoAmbiente, setNuevoAmbiente] = useState('');
  const [nuevaImagen, setNuevaImagen] = useState('');
  const [nuevaDesc, setNuevaDesc] = useState('');

  const agregarProyecto = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('proyectos').insert([
      {
        titulo: nuevoTitulo,
        cliente: nuevoClienteSeleccionado,
        ambiente: nuevoAmbiente.trim() || 'General',
        imagen: nuevaImagen || 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=800&q=80',
        descripcion: nuevaDesc,
        estado: 'En revisión',
        comentarios: ''
      }
    ]);

    if (error) {
      alert('Error al guardar el proyecto en Supabase: ' + error.message);
    } else {
      alert('¡Proyecto y ambiente asignado con éxito!');
      setNuevoTitulo('');
      setNuevoClienteSeleccionado('');
      setNuevoAmbiente('');
      setNuevaImagen('');
      setNuevaDesc('');
      setVista('proyectos');
      fetchProyectos();
    }
  };

  // --- BORRAR PROYECTO ---
  const eliminarProyecto = async (id, titulo) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar el proyecto "${titulo}"?`)) {
      setProyectos(prev => prev.filter(p => p.id !== id));

      const { error } = await supabase
        .from('proyectos')
        .delete()
        .eq('id', id);

      if (error) {
        alert('Error al eliminar el proyecto: ' + error.message);
        fetchProyectos(true);
      }
    }
  };

  // --- ESTADOS PARA CREAR USUARIOS ---
  const [nuevoUsuarioNombre, setNuevoUsuarioNombre] = useState('');
  const [nuevoUsuarioPass, setNuevoUsuarioPass] = useState('');
  const [nuevoUsuarioRol, setNuevoUsuarioRol] = useState('cliente');

  const crearUsuarioNuevo = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('usuarios').insert([
      {
        username: nuevoUsuarioNombre.trim(),
        password: nuevoUsuarioPass.trim(),
        rol: nuevoUsuarioRol
      }
    ]);

    if (error) {
      alert('Error al crear usuario. Es posible que ya exista.');
    } else {
      alert(`¡Usuario "${nuevoUsuarioNombre}" creado con éxito!`);
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
      alert('Error al actualizar el rol del usuario.');
      fetchTodosLosUsuarios();
    } else {
      fetchClientes();
    }
  };

  // --- CAMBIAR ESTADO ---
  const cambiarEstado = async (id, nuevoEstado) => {
    setProyectos(prevProyectos => 
      prevProyectos.map(p => p.id === id ? { ...p, estado: nuevoEstado } : p)
    );

    const { error } = await supabase
      .from('proyectos')
      .update({ estado: nuevoEstado })
      .eq('id', id);

    if (error) {
      alert('Error al actualizar el estado: ' + error.message);
      fetchProyectos(true);
    }
  };

  // --- ENVIAR COMENTARIO ---
  const [textosComentarios, setTextosComentarios] = useState({});

  const enviarComentario = async (proyecto) => {
    const textoNuevo = textosComentarios[proyecto.id];
    if (!textoNuevo || !textoNuevo.trim()) return;

    const historialActual = proyecto.comentarios ? proyecto.comentarios + '\n---\n' : '';
    const fechaActual = new Date().toLocaleDateString();
    const comentarioCompleto = `${usuarioLogueado} (${fechaActual}) : ${textoNuevo.trim()}`;
    const nuevoHistorial = historialActual + comentarioCompleto;

    setProyectos(prevProyectos => 
      prevProyectos.map(p => p.id === proyecto.id ? { ...p, comentarios: nuevoHistorial } : p)
    );
    setTextosComentarios({ ...textosComentarios, [proyecto.id]: '' });

    const { error } = await supabase
      .from('proyectos')
      .update({ comentarios: nuevoHistorial })
      .eq('id', proyecto.id);

    if (error) {
      alert('Error al enviar el comentario: ' + error.message);
      fetchProyectos(true);
    }
  };

  // --- FILTRAR PROYECTOS POR AMBIENTE SELECCIONADO POR EL CLIENTE ---
  const proyectosFiltradosPorAmbiente = proyectos.filter(p => {
    if (!filtroAmbienteCliente) return true;
    return p.ambiente?.toLowerCase() === filtroAmbienteCliente.toLowerCase();
  });

  const ambientesDisponibles = [...new Set(proyectos.map(p => p.ambiente || 'General'))];

  // --- PANTALLA DE LOGIN ---
  if (!usuarioLogueado) {
    return (
      <div style={{ 
        position: 'relative', display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', 
        backgroundImage: `url(${process.env.PUBLIC_URL}/LogotipoMosh-06.jpg.jpeg)`,
        backgroundSize: 'cover', backgroundPosition: 'center',
        fontFamily: "'Inter', system-ui, sans-serif", padding: '20px', overflow: 'hidden' 
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: modoOscuro ? 'rgba(15, 15, 15, 0.78)' : 'rgba(240, 240, 240, 0.78)', backdropFilter: 'blur(12px)' }}></div>

        <button 
          onClick={toggleTema}
          style={{ position: 'absolute', top: '24px', right: '24px', zIndex: 20, background: modoOscuro ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)', color: modoOscuro ? '#fff' : '#000', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '50%', width: '44px', height: '44px', cursor: 'pointer', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
          title="Cambiar modo claro/oscuro"
        >
          {modoOscuro ? '☀️' : '🌙'}
        </button>

        <form onSubmit={manejarLogin} style={{ 
          position: 'relative', zIndex: 10, 
          background: modoOscuro ? 'rgba(24, 24, 24, 0.7)' : 'rgba(255, 255, 255, 0.8)', 
          backdropFilter: 'blur(25px)',
          border: modoOscuro ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.08)', 
          padding: '48px 40px', borderRadius: '20px', boxShadow: modoOscuro ? '0 30px 60px rgba(0,0,0,0.8)' : '0 30px 60px rgba(0,0,0,0.12)', 
          textAlign: 'center', width: '100%', maxWidth: '400px', color: modoOscuro ? 'white' : '#171717'
        }}>
          <h2 style={{ marginBottom: '6px', letterSpacing: '4px', fontWeight: '900', fontSize: '1.8rem' }}>MOSH</h2>
          <p style={{ fontSize: '0.7rem', color: modoOscuro ? '#9ca3af' : '#6b7280', marginBottom: '32px', textTransform: 'uppercase', letterSpacing: '3px', fontWeight: '600' }}>Arquitectura y Diseño</p>
          
          {errorLogin && (
            <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.9)', color: 'white', padding: '12px', borderRadius: '10px', fontSize: '0.85rem', marginBottom: '20px', fontWeight: '600' }}>
              {errorLogin}
            </div>
          )}

          <div style={{ marginBottom: '18px', textAlign: 'left' }}>
            <label style={{ fontSize: '0.7rem', fontWeight: '800', color: modoOscuro ? '#d1d5db' : '#4b5563', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Usuario</label>
            <input 
              type="text" placeholder="Ingrese su usuario" value={inputUser} onChange={(e) => setInputUser(e.target.value)} required
              style={{ width: '100%', padding: '14px 16px', boxSizing: 'border-box', border: modoOscuro ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)', outline: 'none', borderRadius: '10px', backgroundColor: modoOscuro ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)', color: modoOscuro ? 'white' : '#171717', fontSize: '0.95rem' }}
            />
          </div>

          <div style={{ marginBottom: '28px', textAlign: 'left' }}>
            <label style={{ fontSize: '0.7rem', fontWeight: '800', color: modoOscuro ? '#d1d5db' : '#4b5563', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Contraseña</label>
            <input 
              type="password" placeholder="••••••••" value={inputPass} onChange={(e) => setInputPass(e.target.value)} required
              style={{ width: '100%', padding: '14px 16px', boxSizing: 'border-box', border: modoOscuro ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)', outline: 'none', borderRadius: '10px', backgroundColor: modoOscuro ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)', color: modoOscuro ? 'white' : '#171717', fontSize: '0.95rem' }}
            />
          </div>

          <button type="submit" disabled={cargandoLogin} style={{ width: '100%', padding: '14px', backgroundColor: modoOscuro ? '#ffffff' : '#111827', color: modoOscuro ? '#111827' : '#ffffff', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', letterSpacing: '0.5px', fontSize: '0.95rem', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
            {cargandoLogin ? 'Verificando...' : 'Acceder al Portal'}
          </button>
        </form>
      </div>
    );
  }

  // --- INTERFAZ PRINCIPAL MODERNA CON SIDEBAR RETRÁCTIL ---
  return (
    <div 
      onContextMenu={(e) => e.preventDefault()}
      style={{ 
        position: 'relative',
        fontFamily: "'Inter', system-ui, sans-serif", minHeight: '100vh', 
        backgroundColor: modoOscuro ? '#0a0a0a' : '#f8fafc', 
        color: modoOscuro ? '#f3f4f6' : '#1e293b', 
        userSelect: 'none', display: 'flex', overflowX: 'hidden'
      }}
    >
      {/* FONDO GLOBAL CON LOGOTIPO Y BLUR */}
      <div style={{
        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 0,
        backgroundImage: `url(${process.env.PUBLIC_URL}/LogotipoMosh-06.jpg.jpeg)`,
        backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(30px)', opacity: modoOscuro ? 0.15 : 0.08, pointerEvents: 'none'
      }}></div>

      <div style={{
        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 0,
        backgroundColor: modoOscuro ? 'rgba(10, 10, 10, 0.85)' : 'rgba(248, 250, 252, 0.88)', pointerEvents: 'none'
      }}></div>

      {/* BOTÓN FLOTANTE MÓVIL PARA ABRIR/CERRAR MENÚ (HAMBURGUESA) */}
      <button 
        onClick={() => setMenuAbierto(!menuAbierto)}
        style={{
          position: 'fixed', top: '16px', left: '16px', zIndex: 50,
          background: modoOscuro ? 'rgba(30, 30, 30, 0.9)' : 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)', color: modoOscuro ? '#fff' : '#0f172a',
          border: modoOscuro ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
          borderRadius: '10px', width: '44px', height: '44px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}
        title="Menú de navegación"
      >
        {menuAbierto ? '✕' : '☰'}
      </button>

      {/* SIDEBAR LATERAL IZQUIERDO (CON CONTROL MÓVIL) */}
      <aside style={{
        position: 'fixed', top: 0, left: menuAbierto ? 0 : '-280px', width: '280px', height: '100vh', zIndex: 40,
        backgroundColor: modoOscuro ? 'rgba(20, 20, 20, 0.92)' : 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)', borderRight: modoOscuro ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '30px 20px', boxSizing: 'border-box',
        transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: menuAbierto ? '10px 0 30px rgba(0,0,0,0.5)' : 'none'
      }}>
        <div>
          <div style={{ marginBottom: '35px', paddingLeft: '45px' }}>
            <h2 style={{ fontSize: '1.25rem', margin: 0, letterSpacing: '3px', fontWeight: '900', color: modoOscuro ? '#fff' : '#0f172a' }}>MOSH</h2>
            <p style={{ fontSize: '0.65rem', color: modoOscuro ? '#9ca3af' : '#64748b', margin: '4px 0 0 0', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: '700' }}>Arquitectura y Diseño</p>
          </div>

          {/* MENÚ DE NAVEGACIÓN PARA ADMIN */}
          {rolUsuario === 'admin' && (
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: '800', color: modoOscuro ? '#6b7280' : '#94a3b8', paddingLeft: '12px', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '4px' }}>Panel de Control</span>
              
              <button onClick={() => { setVista('proyectos'); setMenuAbierto(false); }} style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 14px', background: vista === 'proyectos' ? (modoOscuro ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)') : 'transparent', color: vista === 'proyectos' ? (modoOscuro ? '#fff' : '#0f172a') : (modoOscuro ? '#9ca3af' : '#475569'), border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '0.9rem', textAlign: 'left', transition: 'all 0.2s' }}>
                📁 Ver Proyectos
              </button>
              
              <button onClick={() => { setVista('subir'); setMenuAbierto(false); }} style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 14px', background: vista === 'subir' ? (modoOscuro ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)') : 'transparent', color: vista === 'subir' ? (modoOscuro ? '#fff' : '#0f172a') : (modoOscuro ? '#9ca3af' : '#475569'), border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '0.9rem', textAlign: 'left', transition: 'all 0.2s' }}>
                ➕ Subir Nuevo Render
              </button>
              
              <button onClick={() => { setVista('crear_usuario'); setMenuAbierto(false); }} style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 14px', background: vista === 'crear_usuario' ? (modoOscuro ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)') : 'transparent', color: vista === 'crear_usuario' ? (modoOscuro ? '#fff' : '#0f172a') : (modoOscuro ? '#9ca3af' : '#475569'), border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '0.9rem', textAlign: 'left', transition: 'all 0.2s' }}>
                👤 Crear Cuenta
              </button>
              
              <button onClick={() => { setVista('gestionar_usuarios'); setMenuAbierto(false); }} style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 14px', background: vista === 'gestionar_usuarios' ? (modoOscuro ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)') : 'transparent', color: vista === 'gestionar_usuarios' ? (modoOscuro ? '#fff' : '#0f172a') : (modoOscuro ? '#9ca3af' : '#475569'), border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '0.9rem', textAlign: 'left', transition: 'all 0.2s' }}>
                👥 Gestionar Usuarios
              </button>
            </nav>
          )}
        </div>

        {/* PERFIL Y CONFIGURACIÓN EN EL FOOTER DEL SIDEBAR */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', borderTop: modoOscuro ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)', paddingTop: '20px' }}>
          <button 
            onClick={toggleTema}
            style={{ width: '100%', padding: '10px 14px', background: modoOscuro ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', color: modoOscuro ? '#e2e8f0' : '#334155', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            {modoOscuro ? '☀️ Modo Claro' : '🌙 Modo Oscuro'}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: modoOscuro ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.03)', padding: '10px 14px', borderRadius: '10px' }}>
            <div style={{ overflow: 'hidden' }}>
              <span style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: modoOscuro ? '#fff' : '#0f172a', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{usuarioLogueado}</span>
              <span style={{ display: 'block', fontSize: '0.7rem', color: modoOscuro ? '#9ca3af' : '#64748b', textTransform: 'uppercase', fontWeight: '600' }}>{rolUsuario}</span>
            </div>
            <button onClick={cerrarSesion} style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', fontWeight: '700', fontSize: '0.75rem' }} title="Cerrar Sesión">Salir</button>
          </div>
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL (CON MARGEN IZQUIERDO ADAPTADO) */}
      <main style={{ position: 'relative', zIndex: 10, flex: 1, padding: '40px 30px 40px 80px', boxSizing: 'border-box', overflowY: 'auto', maxHeight: '100vh' }}>
        <div style={{ maxWidth: '950px', margin: '0 auto' }}>

          {/* VISTA: GESTIONAR USUARIOS */}
          {rolUsuario === 'admin' && vista === 'gestionar_usuarios' ? (
            <div style={{ background: modoOscuro ? 'rgba(22, 22, 22, 0.75)' : 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(20px)', padding: '32px', borderRadius: '20px', boxShadow: modoOscuro ? '0 20px 40px rgba(0,0,0,0.6)' : '0 20px 40px rgba(0,0,0,0.06)', border: modoOscuro ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)' }}>
              <h3 style={{ marginTop: 0, color: modoOscuro ? '#fff' : '#0f172a', fontSize: '1.4rem', fontWeight: '800' }}>Gestión de Usuarios y Roles</h3>
              <p style={{ fontSize: '0.85rem', color: modoOscuro ? '#9ca3af' : '#64748b', marginBottom: '24px' }}>Modifica el rol de cualquier usuario al instante usando el menú desplegable.</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {todosLosUsuarios.map(u => (
                  <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: modoOscuro ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', borderRadius: '12px', border: modoOscuro ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.04)' }}>
                    <div>
                      <span style={{ fontWeight: '800', fontSize: '1rem', color: modoOscuro ? '#fff' : '#0f172a' }}>{u.username}</span>
                      <span style={{ display: 'block', fontSize: '0.75rem', color: modoOscuro ? '#9ca3af' : '#64748b', marginTop: '2px' }}>Contraseña: {u.password}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '0.8rem', color: modoOscuro ? '#9ca3af' : '#64748b', fontWeight: '600' }}>Rol actual:</span>
                      <select 
                        value={u.rol} 
                        onChange={(e) => cambiarRolUsuario(u.id, e.target.value)}
                        style={{ padding: '8px 12px', borderRadius: '8px', border: modoOscuro ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)', backgroundColor: modoOscuro ? '#1a1a1a' : '#ffffff', fontWeight: '700', color: modoOscuro ? '#fff' : '#0f172a', outline: 'none' }}
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
            /* VISTA: SUBIR PROYECTO Y CREAR AMBIENTE */
            <form onSubmit={agregarProyecto} style={{ background: modoOscuro ? 'rgba(22, 22, 22, 0.75)' : 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(20px)', padding: '32px', borderRadius: '20px', boxShadow: modoOscuro ? '0 20px 40px rgba(0,0,0,0.6)' : '0 20px 40px rgba(0,0,0,0.06)', border: modoOscuro ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)' }}>
              <h3 style={{ marginTop: 0, color: modoOscuro ? '#fff' : '#0f172a', fontSize: '1.4rem', fontWeight: '800' }}>Subir Render, Asignar Ambiente y Cliente</h3>
              <p style={{ fontSize: '0.85rem', color: modoOscuro ? '#9ca3af' : '#64748b', marginBottom: '24px' }}>Carga el contenido visual y asigne los parámetros de diseño correspondientes.</p>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '0.75rem', display: 'block', marginBottom: '6px', fontWeight: '800', color: modoOscuro ? '#d1d5db' : '#4b5563', textTransform: 'uppercase', letterSpacing: '1px' }}>Título del Proyecto / Diseño</label>
                <input type="text" placeholder="Ej. Casa de Playa - Residencia" value={nuevoTitulo} onChange={(e) => setNuevoTitulo(e.target.value)} required style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: modoOscuro ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)', background: modoOscuro ? 'rgba(255,255,255,0.05)' : '#fff', color: modoOscuro ? '#fff' : '#000', outline: 'none' }} />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '0.75rem', display: 'block', marginBottom: '6px', fontWeight: '800', color: modoOscuro ? '#d1d5db' : '#4b5563', textTransform: 'uppercase', letterSpacing: '1px' }}>Seleccionar Cliente Destino</label>
                <select 
                  value={nuevoClienteSeleccionado} 
                  onChange={(e) => setNuevoClienteSeleccionado(e.target.value)} 
                  required 
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: modoOscuro ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)', backgroundColor: modoOscuro ? '#1a1a1a' : 'white', color: modoOscuro ? '#fff' : '#000', outline: 'none', fontWeight: '600' }}
                >
                  <option value="">-- Selecciona un cliente de la lista --</option>
                  {listaClientes.map((c, index) => (
                    <option key={index} value={c.username}>{c.username}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '0.75rem', display: 'block', marginBottom: '6px', fontWeight: '800', color: modoOscuro ? '#d1d5db' : '#4b5563', textTransform: 'uppercase', letterSpacing: '1px' }}>Ambiente (Creación libre)</label>
                <input 
                  type="text" 
                  placeholder="Ej. Sala, Cocina, Cuarto 1, Terraza, Baño principal..." 
                  value={nuevoAmbiente} 
                  onChange={(e) => setNuevoAmbiente(e.target.value)} 
                  required 
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: modoOscuro ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)', background: modoOscuro ? 'rgba(255,255,255,0.05)' : '#fff', color: modoOscuro ? '#fff' : '#000', outline: 'none' }} 
                />
                <small style={{ display: 'block', marginTop: '6px', color: modoOscuro ? '#9ca3af' : '#64748b', fontSize: '0.8rem' }}>Escribe libremente el nombre del ambiente al que pertenece este render.</small>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '0.75rem', display: 'block', marginBottom: '6px', fontWeight: '800', color: modoOscuro ? '#d1d5db' : '#4b5563', textTransform: 'uppercase', letterSpacing: '1px' }}>URL de la Imagen / Render</label>
                <input type="text" placeholder="https://..." value={nuevaImagen} onChange={(e) => setNuevaImagen(e.target.value)} required style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: modoOscuro ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)', background: modoOscuro ? 'rgba(255,255,255,0.05)' : '#fff', color: modoOscuro ? '#fff' : '#000', outline: 'none' }} />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ fontSize: '0.75rem', display: 'block', marginBottom: '6px', fontWeight: '800', color: modoOscuro ? '#d1d5db' : '#4b5563', textTransform: 'uppercase', letterSpacing: '1px' }}>Descripción</label>
                <textarea value={nuevaDesc} onChange={(e) => setNuevaDesc(e.target.value)} rows="3" style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: modoOscuro ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)', background: modoOscuro ? 'rgba(255,255,255,0.05)' : '#fff', color: modoOscuro ? '#fff' : '#000', outline: 'none' }}></textarea>
              </div>

              <button type="submit" style={{ backgroundColor: modoOscuro ? '#ffffff' : '#111827', color: modoOscuro ? '#111827' : 'white', padding: '14px 24px', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', fontSize: '0.95rem', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>Guardar y Asignar Render</button>
            </form>
          ) : rolUsuario === 'admin' && vista === 'crear_usuario' ? (
            /* VISTA: CREAR USUARIO */
            <form onSubmit={crearUsuarioNuevo} style={{ background: modoOscuro ? 'rgba(22, 22, 22, 0.75)' : 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(20px)', padding: '32px', borderRadius: '20px', boxShadow: modoOscuro ? '0 20px 40px rgba(0,0,0,0.6)' : '0 20px 40px rgba(0,0,0,0.06)', border: modoOscuro ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)' }}>
              <h3 style={{ marginTop: 0, color: modoOscuro ? '#fff' : '#0f172a', fontSize: '1.4rem', fontWeight: '800' }}>Crear Nuevo Usuario o Cliente</h3>
              <p style={{ fontSize: '0.85rem', color: modoOscuro ? '#9ca3af' : '#64748b', marginBottom: '24px' }}>Registra una nueva cuenta de acceso para un cliente o administrador.</p>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '0.75rem', display: 'block', marginBottom: '6px', fontWeight: '800', color: modoOscuro ? '#d1d5db' : '#4b5563', textTransform: 'uppercase', letterSpacing: '1px' }}>Nombre de Usuario</label>
                <input type="text" placeholder="Ej. Carlos Pérez" value={nuevoUsuarioNombre} onChange={(e) => setNuevoUsuarioNombre(e.target.value)} required style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: modoOscuro ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)', background: modoOscuro ? 'rgba(255,255,255,0.05)' : '#fff', color: modoOscuro ? '#fff' : '#000', outline: 'none' }} />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '0.75rem', display: 'block', marginBottom: '6px', fontWeight: '800', color: modoOscuro ? '#d1d5db' : '#4b5563', textTransform: 'uppercase', letterSpacing: '1px' }}>Contraseña</label>
                <input type="text" placeholder="Ej. CLAVE123" value={nuevoUsuarioPass} onChange={(e) => setNuevoUsuarioPass(e.target.value)} required style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: modoOscuro ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)', background: modoOscuro ? 'rgba(255,255,255,0.05)' : '#fff', color: modoOscuro ? '#fff' : '#000', outline: 'none' }} />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ fontSize: '0.75rem', display: 'block', marginBottom: '6px', fontWeight: '800', color: modoOscuro ? '#d1d5db' : '#4b5563', textTransform: 'uppercase', letterSpacing: '1px' }}>Rol Inicial</label>
                <select value={nuevoUsuarioRol} onChange={(e) => setNuevoUsuarioRol(e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: modoOscuro ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)', backgroundColor: modoOscuro ? '#1a1a1a' : 'white', color: modoOscuro ? '#fff' : '#000', outline: 'none', fontWeight: '600' }}>
                  <option value="cliente">Cliente</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              <button type="submit" style={{ backgroundColor: modoOscuro ? '#ffffff' : '#111827', color: modoOscuro ? '#111827' : 'white', padding: '14px 24px', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', fontSize: '0.95rem', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>Registrar en Supabase</button>
            </form>
          ) : (
            /* VISTA: LISTA DE PROYECTOS Y FILTRO DE AMBIENTES PARA CLIENTES */
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <h2 style={{ color: modoOscuro ? '#fff' : '#0f172a', margin: '0 0 4px 0', fontSize: '1.6rem', fontWeight: '900' }}>
                    {rolUsuario === 'admin' ? 'Todos los Proyectos y Renders' : 'Tus Renders y Diseños Asignados'}
                  </h2>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: modoOscuro ? '#9ca3af' : '#64748b' }}>Explora y evalúa cada espacio de tu proyecto con total seguridad.</p>
                </div>

                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  {/* FILTRO DE AMBIENTE PARA CLIENTES O ADMIN */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: modoOscuro ? 'rgba(22, 22, 22, 0.75)' : 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(10px)', padding: '8px 14px', borderRadius: '12px', border: modoOscuro ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', color: modoOscuro ? '#9ca3af' : '#64748b', textTransform: 'uppercase' }}>Ambiente:</span>
                    <select 
                      value={filtroAmbienteCliente} 
                      onChange={(e) => setFiltroAmbienteCliente(e.target.value)}
                      style={{ padding: '6px 10px', borderRadius: '8px', border: 'none', backgroundColor: modoOscuro ? 'rgba(255,255,255,0.08)' : '#f1f5f9', fontWeight: '700', color: modoOscuro ? '#fff' : '#0f172a', outline: 'none', fontSize: '0.85rem' }}
                    >
                      <option value="">Todos</option>
                      {ambientesDisponibles.map((amb, index) => (
                        <option key={index} value={amb}>{amb}</option>
                      ))}
                    </select>
                  </div>

                  {rolUsuario === 'admin' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: modoOscuro ? 'rgba(22, 22, 22, 0.75)' : 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(10px)', padding: '8px 14px', borderRadius: '12px', border: modoOscuro ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: '800', color: modoOscuro ? '#9ca3af' : '#64748b', textTransform: 'uppercase' }}>Cliente:</span>
                      <select 
                        value={filtroClienteAdmin} 
                        onChange={(e) => setFiltroClienteAdmin(e.target.value)}
                        style={{ padding: '6px 10px', borderRadius: '8px', border: 'none', backgroundColor: modoOscuro ? 'rgba(255,255,255,0.08)' : '#f1f5f9', fontWeight: '700', color: modoOscuro ? '#fff' : '#0f172a', outline: 'none', fontSize: '0.85rem' }}
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
              
              {cargandoProyectos ? (
                <p style={{ textAlign: 'center', color: modoOscuro ? '#9ca3af' : '#64748b', padding: '40px 0' }}>Cargando proyectos...</p>
              ) : proyectosFiltradosPorAmbiente.length === 0 ? (
                <p style={{ textAlign: 'center', color: modoOscuro ? '#9ca3af' : '#64748b', padding: '40px 0' }}>No hay renders encontrados para este filtro.</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '30px' }}>
                  {proyectosFiltradosPorAmbiente.map(p => (
                    <div key={p.id} style={{ background: modoOscuro ? 'rgba(22, 22, 22, 0.75)' : 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(20px)', borderRadius: '20px', overflow: 'hidden', boxShadow: modoOscuro ? '0 20px 40px rgba(0,0,0,0.5)' : '0 20px 40px rgba(0,0,0,0.05)', border: modoOscuro ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)' }}>
                      
                      {/* IMAGEN CON MARCA DE AGUA CORPORATIVA Y CONTAIN */}
                      <div style={{ position: 'relative', width: '100%', height: '380px', backgroundColor: '#09090b' }}>
                        <img 
                          src={p.imagen} 
                          alt={p.titulo} 
                          draggable="false" 
                          style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }} 
                        />
                        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 2 }}></div>
                        <div style={{
                          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(-25deg)',
                          color: 'rgba(255, 255, 255, 0.3)', fontSize: '1.5rem', fontWeight: '900', textAlign: 'center',
                          pointerEvents: 'none', zIndex: '3', width: '100%', textShadow: '0 2px 8px rgba(0,0,0,0.8)', lineHeight: '1.5', letterSpacing: '2px'
                        }}>
                          MOSH<br/>
                          MOSH ARQUITECTURA Y DISEÑO<br/>
                          <span style={{ fontSize: '0.9rem', fontWeight: '700' }}>Visualizado por: {usuarioLogueado}</span>
                        </div>
                      </div>

                      <div style={{ padding: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.7rem', background: modoOscuro ? 'rgba(255,255,255,0.08)' : '#f1f5f9', color: modoOscuro ? '#e2e8f0' : '#334155', padding: '5px 10px', borderRadius: '6px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                              Ambiente: {p.ambiente || 'General'}
                            </span>
                            <span style={{ fontSize: '0.7rem', background: modoOscuro ? 'rgba(255,255,255,0.08)' : '#f1f5f9', color: modoOscuro ? '#e2e8f0' : '#334155', padding: '5px 10px', borderRadius: '6px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                              Cliente: {p.cliente}
                            </span>
                          </div>
                          
                          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <span style={{ 
                              fontSize: '0.75rem', padding: '5px 12px', borderRadius: '6px', fontWeight: '800',
                              backgroundColor: p.estado === 'Aprobado' ? (modoOscuro ? 'rgba(6, 78, 59, 0.6)' : '#dcfce7') : (modoOscuro ? 'rgba(113, 63, 18, 0.6)' : '#fef9c3'),
                              color: p.estado === 'Aprobado' ? (modoOscuro ? '#6ee7b7' : '#166534') : (modoOscuro ? '#fde047' : '#854d0e')
                            }}>
                              {p.estado || 'En revisión'}
                            </span>

                            {rolUsuario === 'admin' && (
                              <button 
                                onClick={() => eliminarProyecto(p.id, p.titulo)}
                                title="Eliminar render"
                                style={{ backgroundColor: modoOscuro ? 'rgba(69, 10, 10, 0.6)' : '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', fontSize: '0.85rem' }}
                              >
                                🗑️
                              </button>
                            )}
                          </div>
                        </div>

                        <h3 style={{ margin: '8px 0 6px 0', color: modoOscuro ? '#fff' : '#0f172a', fontSize: '1.25rem', fontWeight: '800' }}>{p.titulo}</h3>
                        <p style={{ margin: '0 0 20px 0', fontSize: '0.9rem', color: modoOscuro ? '#9ca3af' : '#64748b', lineHeight: '1.6' }}>{p.descripcion}</p>

                        {/* BOTONES ORIGINALES PARA CAMBIAR ESTADO */}
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', background: modoOscuro ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)', padding: '14px', borderRadius: '12px', border: modoOscuro ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.04)' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: '800', alignSelf: 'center', color: modoOscuro ? '#d1d5db' : '#4b5563', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Cambiar Estado:</span>
                          <button 
                            onClick={() => cambiarEstado(p.id, 'Aprobado')}
                            style={{ padding: '8px 14px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '0.85rem', boxShadow: '0 2px 6px rgba(22,163,74,0.3)' }}
                          >
                            ✓ Aprobar
                          </button>
                          <button 
                            onClick={() => cambiarEstado(p.id, 'En revisión')}
                            style={{ padding: '8px 14px', background: '#ca8a04', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '0.85rem', boxShadow: '0 2px 6px rgba(202,138,4,0.3)' }}
                          >
                            ⏳ Marcar en Revisión
                          </button>
                        </div>

                        {/* SECCIÓN DE COMENTARIOS */}
                        <div style={{ borderTop: modoOscuro ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)', paddingTop: '18px' }}>
                          <h4 style={{ margin: '0 0 10px 0', fontSize: '0.85rem', color: modoOscuro ? '#d1d5db' : '#4b5563', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '800' }}>💬 Comentarios y Retroalimentación</h4>
                          
                          <div style={{ background: modoOscuro ? 'rgba(0,0,0,0.25)' : '#f8fafc', padding: '12px 16px', borderRadius: '10px', minHeight: '40px', maxHeight: '120px', overflowY: 'auto', marginBottom: '12px', fontSize: '0.85rem', whiteSpace: 'pre-line', border: modoOscuro ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.04)', color: modoOscuro ? '#e2e8f0' : '#1e293b' }}>
                            {p.comentarios ? p.comentarios : <span style={{ color: modoOscuro ? '#6b7280' : '#94a3b8' }}>No hay comentarios aún. Deja tus observaciones abajo.</span>}
                          </div>

                          <div style={{ display: 'flex', gap: '10px' }}>
                            <input 
                              type="text" 
                              placeholder="Escribe un comentario sobre este render..." 
                              value={textosComentarios[p.id] || ''}
                              onChange={(e) => setTextosComentarios({ ...textosComentarios, [p.id]: e.target.value })}
                              style={{ flex: 1, padding: '12px 14px', borderRadius: '10px', border: modoOscuro ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)', background: modoOscuro ? 'rgba(255,255,255,0.05)' : '#fff', color: modoOscuro ? '#fff' : '#000', fontSize: '0.85rem', outline: 'none' }}
                            />
                            <button 
                              onClick={() => enviarComentario(p)}
                              style={{ padding: '12px 20px', background: modoOscuro ? '#ffffff' : '#111827', color: modoOscuro ? '#111827' : 'white', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', fontSize: '0.85rem' }}
                            >
                              Enviar
                            </button>
                          </div>
                        </div>

                      </div>

                    </div>
                  ))}
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