// src/pages/Clients.jsx
import { useState, useEffect, Fragment } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, Transition } from "@headlessui/react";
import { apiGet, apiPost, apiPut, apiDelete } from "../lib/api";
import AppNavbar from "../components/layout/AppNavbar";
import AppDrawer from "../components/layout/AppDrawer";
import AppFooter from "../components/layout/AppFooter";

// Componente auxiliar para botones
function IconButton({ onClick, className = "", children, title }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation(); // Evita navegar al detalle si haces clic en el botón
        onClick();
      }}
      title={title}
      className={`p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors ${className}`}
    >
      {children}
    </button>
  );
}

export default function Clients() {
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  // Estados de datos
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // Estados Modal Crear/Editar
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    first_name: "", last_name: "", rut: "", email: "", phone: "", address: ""
  });
  const [saving, setSaving] = useState(false);

  // --- NUEVOS ESTADOS PARA ELIMINAR ---
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState(null); // Guardamos el objeto cliente completo para mostrar el nombre
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadClients();
  }, []);

  async function loadClients() {
    setLoading(true);
    try {
      const data = await apiGet("/clients/");
      setClients(data);
    } catch (e) {
      console.error("Error cargando clientes:", e);
    } finally {
      setLoading(false);
    }
  }

  const filtered = clients.filter(c => 
    `${c.first_name} ${c.last_name} ${c.rut}`.toLowerCase().includes(search.toLowerCase())
  );

  // --- Lógica Formulario (Crear/Editar) ---
  const openCreate = () => {
    setEditingId(null);
    setForm({ first_name: "", last_name: "", rut: "", email: "", phone: "", address: "" });
    setIsOpen(true);
  };

  const openEdit = (client) => {
    setEditingId(client.id);
    setForm({ ...client });
    setIsOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await apiPut(`/clients/${editingId}/`, form);
      } else {
        await apiPost("/clients/", form);
      }
      setIsOpen(false);
      loadClients();
    } catch (error) {
      alert("Error al guardar cliente.");
    } finally {
      setSaving(false);
    }
  };

  // --- NUEVAS FUNCIONES DE ELIMINACIÓN ---
  
  // 1. Abrir el modal (no borra todavía)
  const openDeleteModal = (client) => {
    setClientToDelete(client);
    setIsDeleteModalOpen(true);
  };

  // 2. Confirmar borrado (llamada API)
  const confirmDeleteClient = async () => {
    if (!clientToDelete) return;
    setIsDeleting(true);
    try {
      await apiDelete(`/clients/${clientToDelete.id}/`);
      setIsDeleteModalOpen(false);
      setClientToDelete(null);
      loadClients(); // Recargar la lista
    } catch (e) {
      alert("Error al eliminar el cliente.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <AppNavbar 
        title="Gestión de Clientes" 
        onOpenDrawer={() => setDrawerOpen(true)} 
        onLogout={() => { localStorage.clear(); location.href = "/login"; }} 
      />
      <AppDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <main className="flex-1 mx-auto max-w-7xl w-full px-4 py-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Cartera de Clientes</h1>
            <p className="text-sm text-slate-500">Administra tus clientes y sus vehículos.</p>
          </div>
          
          <div className="flex gap-3">
            <input 
              type="text"
              placeholder="Buscar..." 
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <button 
              onClick={openCreate} 
              className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 shadow-sm"
            >
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="2"><path d="M12 4v16m8-8H4" /></svg>
              Nuevo Cliente
            </button>
          </div>
        </div>

        {/* Tabla */}
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 border-b">
                <tr>
                  <th className="px-6 py-4 font-medium">Nombre</th>
                  <th className="px-6 py-4 font-medium">RUT</th>
                  <th className="px-6 py-4 font-medium">Contacto</th>
                  <th className="px-6 py-4 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan="4" className="px-6 py-8 text-center text-slate-500">Cargando...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan="4" className="px-6 py-8 text-center text-slate-500">No se encontraron clientes.</td></tr>
                ) : (
                  filtered.map((c) => (
                    <tr 
                      key={c.id} 
                      className="hover:bg-slate-50 transition-colors cursor-pointer group"
                      onClick={() => navigate(`/clients/${c.id}`)}
                    >
                      <td className="px-6 py-4 font-medium text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {c.first_name} {c.last_name}
                      </td>
                      <td className="px-6 py-4 text-slate-600">{c.rut || "—"}</td>
                      <td className="px-6 py-4 text-slate-600">
                        <div className="flex flex-col">
                          <span>{c.email}</span>
                          <span className="text-xs text-slate-400">{c.phone}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {/* Editar */}
                          <IconButton onClick={() => openEdit(c)} title="Editar cliente">
                            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </IconButton>
                          
                          {/* 🗑️ Eliminar (Ahora abre el modal personalizado) */}
                          <IconButton onClick={() => openDeleteModal(c)} title="Eliminar cliente" className="hover:bg-red-50 hover:text-red-600">
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

      {/* --- Modal Formulario (Crear/Editar) --- */}
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsOpen(false)}>
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all">
                <Dialog.Title className="text-lg font-bold text-slate-900 mb-4">
                  {editingId ? "Editar Cliente" : "Nuevo Cliente"}
                </Dialog.Title>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Nombre</label>
                      <input required value={form.first_name} onChange={e => setForm({...form, first_name: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"/>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Apellido</label>
                      <input required value={form.last_name} onChange={e => setForm({...form, last_name: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"/>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">RUT</label>
                    <input value={form.rut} onChange={e => setForm({...form, rut: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"/>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Email</label>
                      <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"/>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Teléfono</label>
                      <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"/>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Dirección</label>
                    <input value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"/>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={() => setIsOpen(false)} className="px-4 py-2 rounded-lg bg-gray-100 text-sm font-medium hover:bg-gray-200">Cancelar</button>
                    <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
                      {saving ? "Guardando..." : "Guardar"}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* --- NUEVO MODAL DE CONFIRMACIÓN DE ELIMINACIÓN --- */}
      <Transition appear show={isDeleteModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => !isDeleting && setIsDeleteModalOpen(false)}>
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
          
          {/* Contenedor centrado */}
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                
                {/* Icono y Textos Centrados */}
                <div className="text-center">
                  {/* Círculo Rojo con Icono de Advertencia */}
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4">
                    <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                  </div>
                  
                  <Dialog.Title as="h3" className="text-lg font-bold leading-6 text-slate-900">
                    ¿Eliminar Cliente?
                  </Dialog.Title>
                  
                  <div className="mt-2">
                    <p className="text-sm text-slate-500">
                      Estás a punto de eliminar a <strong>{clientToDelete?.first_name} {clientToDelete?.last_name}</strong>.
                      <br/>
                      Esta acción eliminará también <strong>todos sus vehículos y el historial asociado</strong>. Esta acción no se puede deshacer.
                    </p>
                  </div>
                </div>

                {/* Botones de Acción */}
                <div className="mt-6 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    className="inline-flex w-full justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-base font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none sm:text-sm transition-colors"
                    onClick={() => setIsDeleteModalOpen(false)}
                    disabled={isDeleting}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="inline-flex w-full justify-center rounded-lg border border-transparent bg-red-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none sm:text-sm transition-colors disabled:opacity-70"
                    onClick={confirmDeleteClient}
                    disabled={isDeleting}
                  >
                    {isDeleting ? "Eliminando..." : "Eliminar"}
                  </button>
                </div>

              </Dialog.Panel>
            </div>
          </div>
        </Dialog>
      </Transition>

    </div>
  );
}