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
    return savedTheme !== null ? JSON.parse(savedTheme) : true; // Por defecto oscuro (estilo inicial de Mosh)
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
  const [proyectos, setProyectos] = useState([]);
  const [listaClientes, setListaClientes] = useState([]);
  const [todosLosUsuarios, setTodosLosUsuarios] = useState([]);
  const [cargandoProyectos, setCargandoProyectos] = useState(true);

  const [filtroClienteAdmin, setFiltroClienteAdmin] = useState('');

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

  // --- ESTADOS PARA SUBIR PROYECTOS ---
  const [nuevoTitulo, setNuevoTitulo] = useState('');
  const [nuevoClienteSeleccionado, setNuevoClienteSeleccionado] = useState('');
  const [nuevaImagen, setNuevaImagen] = useState('');
  const [nuevaDesc, setNuevaDesc] = useState('');

  const agregarProyecto = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('proyectos').insert([
      {
        titulo: nuevoTitulo,
        cliente: nuevoClienteSeleccionado,
        imagen: nuevaImagen || 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=800&q=80',
        descripcion: nuevaDesc,
        estado: 'En revisión',
        comentarios: ''
      }
    ]);

    if (error) {
      alert('Error al guardar el proyecto en Supabase: ' + error.message);
    } else {
      alert('¡Proyecto asignado y render subido con éxito!');
      setNuevoTitulo('');
      setNuevoClienteSeleccionado('');
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

  // --- PANTALLA DE LOGIN CON SOPORTE DE MODO OSCURO/CLARO ---
  if (!usuarioLogueado) {
    return (
      <div style={{ 
        position: 'relative', display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', 
        backgroundImage: `url(${process.env.PUBLIC_URL}/LogotipoMosh-06.jpg.jpeg)`,
        backgroundSize: 'cover', backgroundPosition: 'center',
        fontFamily: 'system-ui, sans-serif', padding: '20px', overflow: 'hidden' 
      }}>
        {/* Capa de fondo adaptativa */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: modoOscuro ? 'rgba(15, 15, 15, 0.75)' : 'rgba(240, 240, 240, 0.75)', backdropFilter: 'blur(6px)' }}></div>

        {/* Botón flotante para cambiar modo en el login */}
        <button 
          onClick={toggleTema}
          style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 20, background: modoOscuro ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)', color: modoOscuro ? '#fff' : '#000', border: 'none', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          title="Cambiar modo claro/oscuro"
        >
          {modoOscuro ? '☀️' : '🌙'}
        </button>

        <form onSubmit={manejarLogin} style={{ 
          position: 'relative', zIndex: 10, 
          background: modoOscuro ? 'rgba(30, 30, 30, 0.65)' : 'rgba(255, 255, 255, 0.75)', 
          backdropFilter: 'blur(20px)',
          border: 'none', outline: 'none', padding: '40px', borderRadius: '16px', boxShadow: modoOscuro ? '0 25px 50px rgba(0,0,0,0.7)' : '0 25px 50px rgba(0,0,0,0.15)', 
          textAlign: 'center', width: '100%', maxWidth: '380px', color: modoOscuro ? 'white' : '#171717'
        }}>
          <h2 style={{ marginBottom: '4px', letterSpacing: '3px', fontWeight: '800' }}>MOSH</h2>
          <p style={{ fontSize: '0.75rem', color: modoOscuro ? '#d1d5db' : '#525252', marginBottom: '28px', textTransform: 'uppercase', letterSpacing: '3px' }}>Arquitectura y Diseño</p>
          
          {errorLogin && (
            <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.85)', color: 'white', padding: '10px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '16px', fontWeight: 'bold' }}>
              {errorLogin}
            </div>
          )}

          <div style={{ marginBottom: '16px', textAlign: 'left' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: modoOscuro ? '#e5e7eb' : '#404040', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>Usuario</label>
            <input 
              type="text" placeholder="Usuario" value={inputUser} onChange={(e) => setInputUser(e.target.value)} required
              style={{ width: '100%', padding: '12px', boxSizing: 'border-box', border: 'none', outline: 'none', boxShadow: 'none', borderRadius: '8px', backgroundColor: modoOscuro ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)', color: modoOscuro ? 'white' : '#171717' }}
            />
          </div>

          <div style={{ marginBottom: '24px', textAlign: 'left' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: modoOscuro ? '#e5e7eb' : '#404040', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>Contraseña</label>
            <input 
              type="password" placeholder="••••••••" value={inputPass} onChange={(e) => setInputPass(e.target.value)} required
              style={{ width: '100%', padding: '12px', boxSizing: 'border-box', border: 'none', outline: 'none', boxShadow: 'none', borderRadius: '8px', backgroundColor: modoOscuro ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)', color: modoOscuro ? 'white' : '#171717' }}
            />
          </div>

          <button type="submit" disabled={cargandoLogin} style={{ width: '100%', padding: '12px', backgroundColor: modoOscuro ? '#ffffff' : '#171717', color: modoOscuro ? '#171717' : '#ffffff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', letterSpacing: '0.5px' }}>
            {cargandoLogin ? 'Verificando...' : 'Ingresar al Portal'}
          </button>
        </form>
      </div>
    );
  }

  // --- INTERFAZ PRINCIPAL CON MODO OSCURO Y CLARO ---
  return (
    <div 
      onContextMenu={(e) => e.preventDefault()}
      style={{ 
        fontFamily: 'system-ui, sans-serif', minHeight: '100vh', 
        backgroundColor: modoOscuro ? '#121212' : '#f5f5f5', 
        color: modoOscuro ? '#f3f4f6' : '#171717', 
        paddingBottom: '40px', userSelect: 'none', transition: 'background-color 0.3s ease, color 0.3s ease' 
      }}
    >
      <header style={{ backgroundColor: modoOscuro ? '#1a1a1a' : '#1e1e1e', color: 'white', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '1.05rem', margin: 0, letterSpacing: '1px', fontWeight: '600' }}>MOSH ARQUITECTURA Y DISEÑO</h1>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button 
            onClick={toggleTema}
            style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}
            title="Cambiar tema"
          >
            {modoOscuro ? '☀️ Claro' : '🌙 Oscuro'}
          </button>
          
          <span style={{ fontSize: '0.85rem', background: 'rgba(255,255,255,0.08)', padding: '6px 12px', borderRadius: '8px' }}>
            👤 {usuarioLogueado} ({rolUsuario.toUpperCase()})
          </span>
          <button onClick={cerrarSesion} style={{ backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontWeight: 'bold' }}>Salir</button>
        </div>
      </header>

      <div style={{ maxWidth: '900px', margin: '30px auto', padding: '0 16px' }}>
        {rolUsuario === 'admin' && (
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <button onClick={() => setVista('proyectos')} style={{ padding: '8px 16px', background: vista === 'proyectos' ? (modoOscuro ? '#333' : '#262626') : (modoOscuro ? '#1e1e1e' : '#e5e7eb'), color: vista === 'proyectos' ? 'white' : (modoOscuro ? '#d1d5db' : '#374151'), border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Ver Proyectos</button>
            <button onClick={() => setVista('subir')} style={{ padding: '8px 16px', background: vista === 'subir' ? (modoOscuro ? '#333' : '#262626') : (modoOscuro ? '#1e1e1e' : '#e5e7eb'), color: vista === 'subir' ? 'white' : (modoOscuro ? '#d1d5db' : '#374151'), border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>➕ Subir Nuevo Render</button>
            <button onClick={() => setVista('crear_usuario')} style={{ padding: '8px 16px', background: vista === 'crear_usuario' ? (modoOscuro ? '#333' : '#262626') : (modoOscuro ? '#1e1e1e' : '#e5e7eb'), color: vista === 'crear_usuario' ? 'white' : (modoOscuro ? '#d1d5db' : '#374151'), border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>👤 Crear Cuenta</button>
            <button onClick={() => setVista('gestionar_usuarios')} style={{ padding: '8px 16px', background: vista === 'gestionar_usuarios' ? (modoOscuro ? '#333' : '#262626') : (modoOscuro ? '#1e1e1e' : '#e5e7eb'), color: vista === 'gestionar_usuarios' ? 'white' : (modoOscuro ? '#d1d5db' : '#374151'), border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>👥 Gestionar Usuarios y Roles</button>
          </div>
        )}

        {/* VISTA: GESTIONAR USUARIOS */}
        {rolUsuario === 'admin' && vista === 'gestionar_usuarios' ? (
          <div style={{ background: modoOscuro ? '#1e1e1e' : '#ffffff', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: modoOscuro ? '1px solid #333' : '1px solid #e5e7eb' }}>
            <h3 style={{ marginTop: 0, color: modoOscuro ? '#fff' : '#171717' }}>Gestión de Usuarios y Roles</h3>
            <p style={{ fontSize: '0.85rem', color: modoOscuro ? '#a3a3a3' : '#737373', marginBottom: '20px' }}>Modifica el rol de cualquier usuario al instante usando el menú desplegable.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {todosLosUsuarios.map(u => (
                <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: modoOscuro ? '#262626' : '#fafafa', borderRadius: '8px', border: modoOscuro ? '1px solid #383838' : '1px solid #e5e7eb' }}>
                  <div>
                    <span style={{ fontWeight: 'bold', fontSize: '0.95rem', color: modoOscuro ? '#fff' : '#171717' }}>{u.username}</span>
                    <span style={{ display: 'block', fontSize: '0.75rem', color: modoOscuro ? '#a3a3a3' : '#737373' }}>Contraseña: {u.password}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.8rem', color: modoOscuro ? '#a3a3a3' : '#525252' }}>Rol actual:</span>
                    <select 
                      value={u.rol} 
                      onChange={(e) => cambiarRolUsuario(u.id, e.target.value)}
                      style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #d4d4d4', backgroundColor: modoOscuro ? '#333' : 'white', fontWeight: 'bold', color: modoOscuro ? '#fff' : (u.rol === 'admin' ? '#171717' : '#0284c7'), outline: 'none' }}
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
          /* VISTA: SUBIR PROYECTO */
          <form onSubmit={agregarProyecto} style={{ background: modoOscuro ? '#1e1e1e' : '#ffffff', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: modoOscuro ? '1px solid #333' : '1px solid #e5e7eb' }}>
            <h3 style={{ marginTop: 0, color: modoOscuro ? '#fff' : '#171717' }}>Subir Render y Asignar a Cliente</h3>
            
            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '0.85rem', display: 'block', marginBottom: '4px', fontWeight: '500', color: modoOscuro ? '#d1d5db' : '#171717' }}>Título del Proyecto / Diseño</label>
              <input type="text" value={nuevoTitulo} onChange={(e) => setNuevoTitulo(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: modoOscuro ? '1px solid #444' : '1px solid #d4d4d4', background: modoOscuro ? '#262626' : '#fff', color: modoOscuro ? '#fff' : '#000', outline: 'none' }} />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '0.85rem', display: 'block', marginBottom: '4px', fontWeight: '500', color: modoOscuro ? '#d1d5db' : '#171717' }}>Seleccionar Cliente Destino</label>
              <select 
                value={nuevoClienteSeleccionado} 
                onChange={(e) => setNuevoClienteSeleccionado(e.target.value)} 
                required 
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: modoOscuro ? '1px solid #444' : '1px solid #d4d4d4', backgroundColor: modoOscuro ? '#262626' : 'white', color: modoOscuro ? '#fff' : '#000', outline: 'none' }}
              >
                <option value="">-- Selecciona un cliente de la lista --</option>
                {listaClientes.map((c, index) => (
                  <option key={index} value={c.username}>{c.username}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '0.85rem', display: 'block', marginBottom: '4px', fontWeight: '500', color: modoOscuro ? '#d1d5db' : '#171717' }}>URL de la Imagen / Render</label>
              <input type="text" placeholder="https://..." value={nuevaImagen} onChange={(e) => setNuevaImagen(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: modoOscuro ? '1px solid #444' : '1px solid #d4d4d4', background: modoOscuro ? '#262626' : '#fff', color: modoOscuro ? '#fff' : '#000', outline: 'none' }} />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '0.85rem', display: 'block', marginBottom: '4px', fontWeight: '500', color: modoOscuro ? '#d1d5db' : '#171717' }}>Descripción</label>
              <textarea value={nuevaDesc} onChange={(e) => setNuevaDesc(e.target.value)} rows="3" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: modoOscuro ? '1px solid #444' : '1px solid #d4d4d4', background: modoOscuro ? '#262626' : '#fff', color: modoOscuro ? '#fff' : '#000', outline: 'none' }}></textarea>
            </div>

            <button type="submit" style={{ backgroundColor: modoOscuro ? '#ffffff' : '#171717', color: modoOscuro ? '#171717' : 'white', padding: '12px 20px', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Guardar y Asignar</button>
          </form>
        ) : rolUsuario === 'admin' && vista === 'crear_usuario' ? (
          /* VISTA: CREAR USUARIO */
          <form onSubmit={crearUsuarioNuevo} style={{ background: modoOscuro ? '#1e1e1e' : '#ffffff', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: modoOscuro ? '1px solid #333' : '1px solid #e5e7eb' }}>
            <h3 style={{ marginTop: 0, color: modoOscuro ? '#fff' : '#171717' }}>Crear Nuevo Usuario o Cliente</h3>
            
            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '0.85rem', display: 'block', marginBottom: '4px', fontWeight: '500', color: modoOscuro ? '#d1d5db' : '#171717' }}>Nombre de Usuario</label>
              <input type="text" placeholder="Ej. Carlos Pérez" value={nuevoUsuarioNombre} onChange={(e) => setNuevoUsuarioNombre(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: modoOscuro ? '1px solid #444' : '1px solid #d4d4d4', background: modoOscuro ? '#262626' : '#fff', color: modoOscuro ? '#fff' : '#000', outline: 'none' }} />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '0.85rem', display: 'block', marginBottom: '4px', fontWeight: '500', color: modoOscuro ? '#d1d5db' : '#171717' }}>Contraseña</label>
              <input type="text" placeholder="Ej. CLAVE123" value={nuevoUsuarioPass} onChange={(e) => setNuevoUsuarioPass(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: modoOscuro ? '1px solid #444' : '1px solid #d4d4d4', background: modoOscuro ? '#262626' : '#fff', color: modoOscuro ? '#fff' : '#000', outline: 'none' }} />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '0.85rem', display: 'block', marginBottom: '4px', fontWeight: '500', color: modoOscuro ? '#d1d5db' : '#171717' }}>Rol Inicial</label>
              <select value={nuevoUsuarioRol} onChange={(e) => setNuevoUsuarioRol(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: modoOscuro ? '1px solid #444' : '1px solid #d4d4d4', backgroundColor: modoOscuro ? '#262626' : 'white', color: modoOscuro ? '#fff' : '#000', outline: 'none' }}>
                <option value="cliente">Cliente</option>
                <option value="admin">Administrador</option>
              </select>
            </div>

            <button type="submit" style={{ backgroundColor: modoOscuro ? '#ffffff' : '#171717', color: modoOscuro ? '#171717' : 'white', padding: '12px 20px', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Registrar en Supabase</button>
          </form>
        ) : (
          /* VISTA: LISTA DE PROYECTOS */
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <h2 style={{ color: modoOscuro ? '#fff' : '#171717', margin: 0 }}>
                {rolUsuario === 'admin' ? 'Todos los Proyectos y Renders Subidos' : 'Tus Renders y Diseños Asignados'}
              </h2>

              {rolUsuario === 'admin' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: modoOscuro ? '#1e1e1e' : 'white', padding: '6px 12px', borderRadius: '8px', border: modoOscuro ? '1px solid #333' : '1px solid #d4d4d4' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: modoOscuro ? '#d1d5db' : '#525252' }}>Filtrar cliente:</span>
                  <select 
                    value={filtroClienteAdmin} 
                    onChange={(e) => setFiltroClienteAdmin(e.target.value)}
                    style={{ padding: '6px 8px', borderRadius: '6px', border: '1px solid #d4d4d4', backgroundColor: modoOscuro ? '#262626' : '#fafafa', fontWeight: 'bold', color: modoOscuro ? '#fff' : '#171717', outline: 'none' }}
                  >
                    <option value="">-- Todos los clientes --</option>
                    {listaClientes.map((c, index) => (
                      <option key={index} value={c.username}>{c.username}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            
            {cargandoProyectos ? (
              <p style={{ textAlign: 'center', color: modoOscuro ? '#a3a3a3' : '#737373' }}>Cargando proyectos...</p>
            ) : proyectos.length === 0 ? (
              <p style={{ textAlign: 'center', color: modoOscuro ? '#a3a3a3' : '#737373' }}>No hay proyectos encontrados con este filtro.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
                {proyectos.map(p => (
                  <div key={p.id} style={{ background: modoOscuro ? '#1e1e1e' : '#ffffff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: modoOscuro ? '1px solid #333' : '1px solid #e5e7eb' }}>
                    
                    {/* IMAGEN CON MARCA DE AGUA CORPORATIVA */}
                    <div style={{ position: 'relative', width: '100%', height: '350px', backgroundColor: '#000' }}>
                      <img 
                        src={p.imagen} 
                        alt={p.titulo} 
                        draggable="false" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} 
                      />
                      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 2 }}></div>
                      <div style={{
                        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(-25deg)',
                        color: 'rgba(255, 255, 255, 0.35)', fontSize: '1.5rem', fontWeight: 'bold', textAlign: 'center',
                        pointerEvents: 'none', zIndex: '3', width: '100%', textShadow: '0 2px 4px rgba(0,0,0,0.6)', lineHeight: '1.4'
                      }}>
                        MOSH<br/>
                        MOSH ARQUITECTURA Y DISEÑO<br/>
                        <span style={{ fontSize: '0.95rem' }}>Visualizado por: {usuarioLogueado}</span>
                      </div>
                    </div>

                    <div style={{ padding: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <span style={{ fontSize: '0.75rem', background: modoOscuro ? '#2d2d2d' : '#f5f5f5', color: modoOscuro ? '#d1d5db' : '#383838', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                          Cliente: {p.cliente}
                        </span>
                        
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span style={{ 
                            fontSize: '0.75rem', padding: '4px 10px', borderRadius: '4px', fontWeight: 'bold',
                            backgroundColor: p.estado === 'Aprobado' ? (modoOscuro ? '#064e3b' : '#dcfce7') : (modoOscuro ? '#713f12' : '#fef9c3'),
                            color: p.estado === 'Aprobado' ? (modoOscuro ? '#6ee7b7' : '#166534') : (modoOscuro ? '#fde047' : '#854d0e')
                          }}>
                            Estado: {p.estado || 'En revisión'}
                          </span>

                          {rolUsuario === 'admin' && (
                            <button 
                              onClick={() => eliminarProyecto(p.id, p.titulo)}
                              title="Eliminar render"
                              style={{ backgroundColor: modoOscuro ? '#450a0a' : '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', fontSize: '0.9rem' }}
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                      </div>

                      <h3 style={{ margin: '10px 0 6px 0', color: modoOscuro ? '#fff' : '#171717' }}>{p.titulo}</h3>
                      <p style={{ margin: '0 0 16px 0', fontSize: '0.9rem', color: modoOscuro ? '#a3a3a3' : '#737373' }}>{p.descripcion}</p>

                      {/* BOTONES PARA CAMBIAR ESTADO */}
                      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', background: modoOscuro ? '#262626' : '#fafafa', padding: '12px', borderRadius: '8px', border: modoOscuro ? '1px solid #333' : '1px solid #e5e7eb' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 'bold', alignSelf: 'center', color: modoOscuro ? '#d1d5db' : '#404040' }}>Cambiar Estado:</span>
                        <button 
                          onClick={() => cambiarEstado(p.id, 'Aprobado')}
                          style={{ padding: '6px 12px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
                        >
                          ✓ Aprobar
                        </button>
                        <button 
                          onClick={() => cambiarEstado(p.id, 'En revisión')}
                          style={{ padding: '6px 12px', background: '#ca8a04', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
                        >
                          ⏳ Marcar en Revisión
                        </button>
                      </div>

                      {/* SECCIÓN DE COMENTARIOS */}
                      <div style={{ borderTop: modoOscuro ? '1px solid #333' : '1px solid #e5e7eb', paddingTop: '14px' }}>
                        <h4 style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: modoOscuro ? '#d1d5db' : '#404040' }}>💬 Comentarios y Retroalimentación</h4>
                        
                        <div style={{ background: modoOscuro ? '#262626' : '#fafafa', padding: '10px', borderRadius: '6px', minHeight: '40px', maxHeight: '120px', overflowY: 'auto', marginBottom: '10px', fontSize: '0.85rem', whiteSpace: 'pre-line', border: modoOscuro ? '1px solid #333' : '1px solid #e5e7eb', color: modoOscuro ? '#e5e7eb' : '#171717' }}>
                          {p.comentarios ? p.comentarios : <span style={{ color: '#a3a3a3' }}>No hay comentarios aún. Deja tus observaciones abajo.</span>}
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                          <input 
                            type="text" 
                            placeholder="Escribe un comentario sobre este render..." 
                            value={textosComentarios[p.id] || ''}
                            onChange={(e) => setTextosComentarios({ ...textosComentarios, [p.id]: e.target.value })}
                            style={{ flex: 1, padding: '8px', borderRadius: '6px', border: modoOscuro ? '1px solid #444' : '1px solid #d4d4d4', background: modoOscuro ? '#262626' : '#fff', color: modoOscuro ? '#fff' : '#000', fontSize: '0.85rem', outline: 'none' }}
                          />
                          <button 
                            onClick={() => enviarComentario(p)}
                            style={{ padding: '8px 14px', background: modoOscuro ? '#ffffff' : '#171717', color: modoOscuro ? '#171717' : 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }}
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
    </div>
  );
}

export default App;