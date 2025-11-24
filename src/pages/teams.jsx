// src/pages/Team.jsx
import { useState, useEffect, Fragment } from "react";
import { apiPost, apiGet, apiDelete, apiPut } from "../lib/api";
import AppNavbar from "../components/layout/AppNavbar";
import AppDrawer from "../components/layout/AppDrawer";
import AppFooter from "../components/layout/AppFooter";
import { useNavigate } from "react-router-dom";
import { Dialog, Transition } from "@headlessui/react";

// Componente auxiliar para botones de acción
function IconButton({ onClick, className = "", children, title }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors ${className}`}
    >
      {children}
    </button>
  );
}

export default function Team() {
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  // Estados de datos y carga
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estados de Modales
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Estados de selección para Editar/Eliminar
  const [editingId, setEditingId] = useState(null); // Si es null, estamos creando
  const [memberToDelete, setMemberToDelete] = useState(null);

  // Formulario
  const [form, setForm] = useState({ 
    username: "", 
    email: "", 
    phone: "", 
    role: "mechanic", 
    password: "" 
  });
  
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  // 1. SEGURIDAD: Verificar que sea Owner al entrar
  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role !== 'owner') {
      // Si no es dueño, lo sacamos de aquí
      navigate("/dashboard");
    } else {
      // Si es dueño, cargamos la lista
      loadTeam();
    }
  }, [navigate]);

  // 2. Cargar lista de empleados
  const loadTeam = async () => {
    setLoading(true);
    try {
      const data = await apiGet("/mechanics/");
      setTeamMembers(data);
    } catch (error) {
      console.error("Error al cargar equipo:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- Helpers para Roles ---
  const getRoleValue = (displayRole) => {
    // Convierte el texto legible (del backend) al valor interno para el select
    if (displayRole === 'Administración') return 'admin';
    if (displayRole === 'Ayudante') return 'assistant';
    return 'mechanic';
  };

  const getRoleBadgeColor = (roleName) => {
    if (roleName === 'Administración') return 'bg-purple-100 text-purple-800';
    if (roleName === 'Ayudante') return 'bg-yellow-100 text-yellow-800';
    return 'bg-blue-100 text-blue-800'; // Mecánico por defecto
  };

  // --- Lógica del Formulario (Crear / Editar) ---
  const openCreate = () => {
    setEditingId(null);
    setForm({ username: "", email: "", phone: "", role: "mechanic", password: "" });
    setMsg({ type: "", text: "" });
    setIsFormModalOpen(true);
  };

  const openEdit = (member) => {
    setEditingId(member.id);
    setForm({ 
      username: member.username, 
      email: member.email || "", 
      phone: member.phone || "", 
      role: getRoleValue(member.role), 
      password: "" // Contraseña vacía para no cambiarla accidentalmente
    });
    setMsg({ type: "", text: "" });
    setIsFormModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg({ type: "", text: "" });

    try {
      if (editingId) {
        // MODO EDICIÓN (PUT)
        await apiPut(`/mechanics/${editingId}/`, form);
        setMsg({ type: "success", text: "Empleado actualizado correctamente." });
      } else {
        // MODO CREACIÓN (POST)
        await apiPost("/mechanics/", form);
        setMsg({ type: "success", text: "Empleado creado correctamente." });
      }
      
      await loadTeam(); // Recargar la tabla
      
      // Cerrar modal después de un momento
      setTimeout(() => {
        setIsFormModalOpen(false);
        setMsg({ type: "", text: "" });
      }, 1500);

    } catch (error) {
      let errorText = "Ocurrió un error.";
      try {
        const parsed = JSON.parse(error.message);
        errorText = parsed.error || parsed.detail || errorText;
      } catch(e) { /* No es JSON */ }
      setMsg({ type: "error", text: errorText });
    } finally {
      setSaving(false);
    }
  };

  // --- Lógica de Eliminación ---
  const openDelete = (member) => {
    setMemberToDelete(member);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!memberToDelete) return;
    setSaving(true);
    try {
      await apiDelete(`/mechanics/${memberToDelete.id}/`);
      await loadTeam(); // Recargar lista
      setIsDeleteModalOpen(false);
      setMemberToDelete(null);
    } catch (error) {
      alert("Error al eliminar el empleado.");
    } finally {
      setSaving(false);
    }
  };

  // Menú lateral (Drawer)
  const drawerItems = [
    { label: "Órdenes", onClick: () => navigate("/dashboard") },
    { label: "Inventario", onClick: () => navigate("/inventory") },
    { label: "Externalización", onClick: () => navigate("/external") },
    { label: "Mi Personal", onClick: () => navigate("/team") },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <AppNavbar 
        title="Gestión de Equipo" 
        onOpenDrawer={() => setDrawerOpen(true)} 
        onLogout={() => { localStorage.clear(); location.href = "/login"; }} 
      />
      <AppDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} items={drawerItems} />

      <main className="flex-1 mx-auto max-w-6xl w-full px-4 py-8">
        
        {/* Cabecera */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Mi Personal</h1>
            <p className="text-sm text-slate-500">Administra mecánicos, ayudantes y administrativos.</p>
          </div>
          <button 
            onClick={openCreate} 
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 shadow-sm transition-all"
          >
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            Nuevo Empleado
          </button>
        </div>

        {/* Tabla de Personal */}
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 border-b">
                <tr>
                  <th className="px-6 py-4 font-medium">Usuario</th>
                  <th className="px-6 py-4 font-medium">Email</th>
                  <th className="px-6 py-4 font-medium">Teléfono</th>
                  <th className="px-6 py-4 font-medium">Rol</th>
                  <th className="px-6 py-4 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-500">Cargando equipo...</td></tr>
                ) : teamMembers.length === 0 ? (
                  <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-500">No tienes personal registrado aún.</td></tr>
                ) : (
                  teamMembers.map((member) => (
                    <tr key={member.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-900">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">
                            {member.username.substring(0, 2).toUpperCase()}
                          </div>
                          {member.username}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-500">{member.email || "—"}</td>
                      <td className="px-6 py-4 text-slate-500">{member.phone || "—"}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(member.role)}`}>
                          {member.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {/* Botón Editar */}
                          <IconButton onClick={() => openEdit(member)} title="Editar empleado">
                            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </IconButton>
                          {/* Botón Eliminar */}
                          <IconButton onClick={() => openDelete(member)} title="Eliminar empleado" className="hover:bg-red-50 hover:text-red-600">
                            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M3 6h18" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                          </IconButton>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <AppFooter />

      {/* --- MODAL: FORMULARIO (Crear / Editar) --- */}
      <Transition appear show={isFormModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsFormModalOpen(false)}>
          <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all">
                  <Dialog.Title as="h3" className="text-lg font-bold text-slate-900 mb-4">
                    {editingId ? "Editar Empleado" : "Nuevo Empleado"}
                  </Dialog.Title>

                  {msg.text && (
                    <div className={`p-3 rounded mb-4 text-sm ${msg.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {msg.text}
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Usuario</label>
                      <input 
                        type="text" 
                        value={form.username} 
                        onChange={e => setForm({...form, username: e.target.value})} 
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                        placeholder="Ej: juan_perez"
                        required 
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                        <input 
                          type="email" 
                          value={form.email} 
                          onChange={e => setForm({...form, email: e.target.value})} 
                          className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                          placeholder="juan@mail.com"
                          required 
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
                        <input 
                          type="text" 
                          value={form.phone} 
                          onChange={e => setForm({...form, phone: e.target.value})} 
                          className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                          placeholder="+569..." 
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Rol en el taller</label>
                      <select 
                        value={form.role} 
                        onChange={e => setForm({...form, role: e.target.value})} 
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                      >
                        <option value="mechanic">Mecánico</option>
                        <option value="assistant">Ayudante</option>
                        <option value="admin">Administración</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        {editingId ? "Nueva Contraseña (Opcional)" : "Contraseña"}
                      </label>
                      <input 
                        type="text" 
                        value={form.password} 
                        onChange={e => setForm({...form, password: e.target.value})} 
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                        placeholder={editingId ? "Dejar en blanco para mantener actual" : "Contraseña de acceso"}
                        required={!editingId} 
                      />
                    </div>
                    
                    <div className="pt-2 flex justify-end gap-2">
                        <button 
                          type="button" 
                          onClick={() => setIsFormModalOpen(false)} 
                          className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200"
                        >
                          Cancelar
                        </button>
                        <button 
                          type="submit" 
                          disabled={saving} 
                          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                        >
                          {saving ? "Guardando..." : (editingId ? "Guardar Cambios" : "Registrar")}
                        </button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* --- MODAL: CONFIRMACIÓN DE ELIMINAR --- */}
      <Transition appear show={isDeleteModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsDeleteModalOpen(false)}>
          <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                <Dialog.Panel className="w-full max-w-sm transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title as="h3" className="text-lg font-bold text-slate-900">
                    ¿Eliminar empleado?
                  </Dialog.Title>
                  <div className="mt-2">
                    <p className="text-sm text-slate-500">
                      ¿Estás seguro de que quieres eliminar a <strong>{memberToDelete?.username}</strong>? Esta acción no se puede deshacer y perderá el acceso al sistema inmediatamente.
                    </p>
                  </div>

                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-lg border border-transparent bg-slate-100 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-200 focus:outline-none"
                      onClick={() => setIsDeleteModalOpen(false)}
                    >
                      No, cancelar
                    </button>
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-lg border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none"
                      onClick={confirmDelete}
                      disabled={saving}
                    >
                      {saving ? "Eliminando..." : "Sí, eliminar"}
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

    </div>
  );
}