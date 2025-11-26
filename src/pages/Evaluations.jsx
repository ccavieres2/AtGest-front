// src/pages/Evaluations.jsx
import { useState, useEffect, Fragment } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, Transition } from "@headlessui/react";
import { apiGet, apiDelete } from "../lib/api"; // Quitamos apiPost
import { PATHS } from "../routes/path";
import AppNavbar from "../components/layout/AppNavbar";
import AppDrawer from "../components/layout/AppDrawer";
import AppFooter from "../components/layout/AppFooter";

// --- Componentes de Botones ---
function IconButton({ onClick, children, title, className = "", disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={`p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
}

function PrimaryButton({ title, onClick, children }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 shadow-sm transition-all"
    >
      {children}
    </button>
  );
}

export default function Evaluations() {
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Estados para Modal de Eliminación
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [evalToDelete, setEvalToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadEvaluations();
  }, []);

  const loadEvaluations = async () => {
    setLoading(true);
    try {
      const data = await apiGet("/evaluations/");
      setEvaluations(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Filtro de búsqueda
  const filtered = evaluations.filter(ev => {
    const clientName = ev.client_data ? `${ev.client_data.first_name} ${ev.client_data.last_name}` : "";
    const vehicleInfo = ev.vehicle_data ? `${ev.vehicle_data.brand} ${ev.vehicle_data.model}` : "";
    const text = `${clientName} ${vehicleInfo} #${ev.id}`.toLowerCase();
    return text.includes(search.toLowerCase());
  });

  // --- Funciones de Acción ---
  const handleCreate = () => {
    navigate(PATHS.evaluationNew);
  };

  const handleEdit = (id) => {
    navigate(`/evaluations/${id}`); 
  };

  const openDeleteModal = (ev) => {
    setEvalToDelete(ev);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!evalToDelete) return;
    setIsDeleting(true);
    try {
      await apiDelete(`/evaluations/${evalToDelete.id}/`);
      setEvaluations(prev => prev.filter(e => e.id !== evalToDelete.id));
      setIsDeleteModalOpen(false);
      setEvalToDelete(null);
    } catch (e) {
      alert("Error al eliminar.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Helpers de formato
  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString("es-CL");
  
  const calculateTotal = (ev) => {
    if (!ev.items) return 0;
    return ev.items.reduce((sum, item) => sum + Number(item.price || 0), 0);
  };

  // Helper para mostrar estado bonito
  const getStatusBadge = (status) => {
    switch(status) {
      case 'approved': return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Aprobado</span>;
      case 'sent': return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Enviado</span>;
      case 'rejected': return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Rechazado</span>;
      default: return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">Borrador</span>;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <AppNavbar 
        title="Evaluaciones" 
        onOpenDrawer={() => setDrawerOpen(true)} 
        onLogout={() => { localStorage.clear(); location.href = "/login"; }}
      />
      <AppDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <main className="flex-1 mx-auto max-w-7xl w-full px-4 py-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Evaluaciones y Presupuestos</h1>
            <p className="text-sm text-slate-500">Gestiona los diagnósticos realizados a los vehículos.</p>
          </div>
          
          <div className="flex gap-3">
            <div className="relative">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar cliente o vehículo..."
                className="w-full sm:w-64 border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <svg className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            
            <PrimaryButton title="Crear nueva evaluación" onClick={handleCreate}>
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              <span>Nueva Evaluación</span>
            </PrimaryButton>
          </div>
        </div>

        {/* Tabla */}
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 border-b">
                <tr>
                  <th className="px-6 py-4 font-medium"># ID</th>
                  <th className="px-6 py-4 font-medium">Fecha</th>
                  <th className="px-6 py-4 font-medium">Estado</th>
                  <th className="px-6 py-4 font-medium">Cliente</th>
                  <th className="px-6 py-4 font-medium">Vehículo</th>
                  <th className="px-6 py-4 font-medium">Total</th>
                  <th className="px-6 py-4 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan="7" className="px-6 py-8 text-center text-slate-500">Cargando...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan="7" className="px-6 py-8 text-center text-slate-500">No hay evaluaciones registradas.</td></tr>
                ) : (
                  filtered.map((ev) => (
                    <tr key={ev.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4 font-mono text-slate-600">#{ev.id}</td>
                      <td className="px-6 py-4 text-slate-600">{formatDate(ev.created_at)}</td>
                      <td className="px-6 py-4">{getStatusBadge(ev.status)}</td>
                      <td className="px-6 py-4 font-medium text-slate-900">
                        {ev.client_data ? `${ev.client_data.first_name} ${ev.client_data.last_name}` : "—"}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {ev.vehicle_data ? `${ev.vehicle_data.brand} ${ev.vehicle_data.model}` : "—"}
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-900">
                        ${calculateTotal(ev).toLocaleString("es-CL")}
                      </td>
                      <td className="px-6 py-4 text-right">
                        
                        <div className="flex justify-end gap-2">
                          
                          {/* Editar (Ahora única vía para generar orden) */}
                          <IconButton onClick={() => handleEdit(ev.id)} title="Ver detalle / Editar">
                            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </IconButton>
                          
                          {/* Eliminar */}
                          <IconButton onClick={() => openDeleteModal(ev)} title="Eliminar evaluación" className="text-red-400 hover:bg-red-50 hover:text-red-600">
                            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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

      {/* --- Modal Confirmar Eliminación --- */}
      <Transition appear show={isDeleteModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => !isDeleting && setIsDeleteModalOpen(false)}>
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4">
                    <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                  </div>
                  <Dialog.Title as="h3" className="text-lg font-bold leading-6 text-slate-900">
                    ¿Eliminar Evaluación?
                  </Dialog.Title>
                  <div className="mt-2">
                    <p className="text-sm text-slate-500">
                      Estás a punto de eliminar la evaluación <strong>#{evalToDelete?.id}</strong>. Esta acción no se puede deshacer.
                    </p>
                  </div>
                </div>
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
                    onClick={confirmDelete}
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