// src/pages/ClientDetail.jsx
import { useState, useEffect, Fragment } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Dialog, Transition } from "@headlessui/react";
import { apiGet, apiPost, apiPut, apiDelete } from "../lib/api";
import AppNavbar from "../components/layout/AppNavbar";
import AppDrawer from "../components/layout/AppDrawer";
import AppFooter from "../components/layout/AppFooter";

// Componente de botón auxiliar
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

export default function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // --- Estados para Modal Crear/Editar Vehículo ---
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [editingVehicleId, setEditingVehicleId] = useState(null);
  const [vehicleForm, setVehicleForm] = useState({
    brand: "", model: "", year: "", plate: "", color: "", vin: ""
  });
  const [savingVehicle, setSavingVehicle] = useState(false);

  // --- Estados para Eliminar ---
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [vehicleToDeleteId, setVehicleToDeleteId] = useState(null);
  const [deletingVehicle, setDeletingVehicle] = useState(false);

  // Cargar datos al iniciar
  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await apiGet(`/clients/${id}/`);
      setClient(data);
    } catch (e) {
      console.error(e);
      alert("No se pudo cargar el cliente.");
      navigate("/clients");
    } finally {
      setLoading(false);
    }
  };

  // --- Funciones Crear/Editar ---
  const openAddVehicle = () => {
    setEditingVehicleId(null);
    setVehicleForm({ brand: "", model: "", year: "", plate: "", color: "", vin: "" });
    setIsVehicleModalOpen(true);
  };

  const openEditVehicle = (vehicle) => {
    setEditingVehicleId(vehicle.id);
    setVehicleForm({
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year,
      plate: vehicle.plate,
      color: vehicle.color || "",
      vin: vehicle.vin || ""
    });
    setIsVehicleModalOpen(true);
  };

  const handleSaveVehicle = async (e) => {
    e.preventDefault();
    setSavingVehicle(true);
    try {
      if (editingVehicleId) {
        await apiPut(`/vehicles/${editingVehicleId}/`, { ...vehicleForm, client: id });
      } else {
        await apiPost("/vehicles/", { ...vehicleForm, client: id });
      }
      setIsVehicleModalOpen(false);
      setVehicleForm({ brand: "", model: "", year: "", plate: "", color: "", vin: "" });
      loadData();
    } catch (error) {
      console.error(error);
      alert("Error al guardar el vehículo.");
    } finally {
      setSavingVehicle(false);
    }
  };

  // --- Funciones de Eliminación ---
  const openDeleteModal = (vid) => {
    setVehicleToDeleteId(vid);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteVehicle = async () => {
    if (!vehicleToDeleteId) return;
    setDeletingVehicle(true);
    try {
      await apiDelete(`/vehicles/${vehicleToDeleteId}/`);
      setIsDeleteModalOpen(false);
      setVehicleToDeleteId(null);
      loadData();
    } catch (e) {
      alert("Error al eliminar vehículo.");
    } finally {
      setDeletingVehicle(false);
    }
  };

  // Helper para formatear fecha
  const formatDate = (dateString) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleString("es-CL", { 
      day: "2-digit", 
      month: "2-digit", 
      year: "numeric", 
      hour: "2-digit", 
      minute: "2-digit" 
    });
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-500">Cargando...</div>;
  if (!client) return null;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <AppNavbar title="Detalle Cliente" onOpenDrawer={() => setDrawerOpen(true)} onLogout={() => { localStorage.clear(); location.href = "/login"; }} />
      <AppDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <main className="flex-1 mx-auto max-w-5xl w-full px-4 py-8">
        
        {/* Botón Volver */}
        <button onClick={() => navigate("/clients")} className="mb-6 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-indigo-600 font-medium transition-colors">
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
          Volver a Clientes
        </button>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* TARJETA 1: Datos del Cliente */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-14 w-14 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-2xl border border-indigo-100">
                  {client.first_name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 leading-tight">{client.first_name}</h2>
                  <h2 className="text-xl font-bold text-slate-900 leading-tight">{client.last_name}</h2>
                </div>
              </div>
              
              <div className="space-y-4 text-sm">
                <div className="border-b border-slate-50 pb-3">
                  <label className="block text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">RUT / DNI</label>
                  <p className="text-slate-700 font-medium">{client.rut || "—"}</p>
                </div>
                <div className="border-b border-slate-50 pb-3">
                  <label className="block text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Contacto</label>
                  <p className="text-slate-700">{client.email || "Sin email"}</p>
                  <p className="text-slate-700">{client.phone || "Sin teléfono"}</p>
                </div>
                
                <div className="border-b border-slate-50 pb-3">
                  <label className="block text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Dirección</label>
                  <p className="text-slate-700">{client.address || "—"}</p>
                </div>

                {/* 👇 AQUÍ ESTÁ EL CAMBIO: FECHA DE INGRESO */}
                <div>
                  <label className="block text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Fecha de Ingreso</label>
                  <p className="text-slate-700">{formatDate(client.created_at)}</p>
                </div>
                {/* 👆 FIN DEL CAMBIO */}

              </div>
            </div>
          </div>

          {/* TARJETA 2: Vehículos */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden h-full">
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5 text-slate-400" strokeWidth="2">
                    <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
                    <circle cx="7" cy="17" r="2" />
                    <path d="M9 17h6" />
                    <circle cx="17" cy="17" r="2" />
                  </svg>
                  Vehículos ({client.vehicles ? client.vehicles.length : 0})
                </h3>
                <button 
                  onClick={openAddVehicle}
                  className="text-xs bg-indigo-600 text-white px-3 py-2 rounded-lg hover:bg-indigo-700 font-semibold shadow-sm transition-all active:scale-95"
                >
                  + Agregar Vehículo
                </button>
              </div>

              {client.vehicles && client.vehicles.length > 0 ? (
                <ul className="divide-y divide-slate-100">
                  {client.vehicles.map((v) => (
                    <li key={v.id} className="px-6 py-4 hover:bg-slate-50 transition-colors flex justify-between items-center group">
                      <div className="flex items-center gap-4">
                        
                        {/* Icono Auto */}
                        <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l2-5h10l2 5M3 10h18M5 10v8a2 2 0 002 2h10a2 2 0 002-2v-8" /> 
                            <circle cx="7" cy="15" r="2" fill="currentColor" className="text-blue-200" />
                            <circle cx="17" cy="15" r="2" fill="currentColor" className="text-blue-200" />
                          </svg>
                        </div>

                        <div>
                          <p className="font-bold text-slate-900 text-sm">{v.brand} {v.model}</p>
                          <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                            <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 border border-slate-200">{v.plate}</span>
                            <span>• {v.year}</span>
                            {v.color && <span>• {v.color}</span>}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        {/* Editar */}
                        <IconButton onClick={() => openEditVehicle(v)} title="Editar vehículo">
                          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </IconButton>

                        {/* Eliminar */}
                        <IconButton onClick={() => openDeleteModal(v.id)} title="Eliminar vehículo" className="text-red-400 hover:bg-red-50 hover:text-red-600">
                          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </IconButton>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-10 text-center flex flex-col items-center justify-center text-slate-400">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="w-12 h-12 mb-3 text-slate-300">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <p className="text-sm">No hay vehículos registrados.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <AppFooter />

      {/* --- Modal Agregar/Editar Vehículo --- */}
      <Transition appear show={isVehicleModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsVehicleModalOpen(false)}>
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all">
                <Dialog.Title className="text-lg font-bold text-slate-900 mb-4">
                  {editingVehicleId ? "Editar Vehículo" : "Agregar Vehículo"}
                </Dialog.Title>
                
                <form onSubmit={handleSaveVehicle} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Marca</label>
                      <input required type="text" value={vehicleForm.brand} onChange={e => setVehicleForm({...vehicleForm, brand: e.target.value})} 
                        className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Ej: Toyota" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Modelo</label>
                      <input required type="text" value={vehicleForm.model} onChange={e => setVehicleForm({...vehicleForm, model: e.target.value})} 
                        className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Ej: Yaris" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Año</label>
                      <input required type="number" value={vehicleForm.year} onChange={e => setVehicleForm({...vehicleForm, year: e.target.value})} 
                        className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500" placeholder="2020" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Patente</label>
                      <input required type="text" value={vehicleForm.plate} onChange={e => setVehicleForm({...vehicleForm, plate: e.target.value.toUpperCase()})} 
                        className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-mono uppercase" placeholder="ABCD-12" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Color</label>
                      <input type="text" value={vehicleForm.color} onChange={e => setVehicleForm({...vehicleForm, color: e.target.value})} 
                        className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Rojo" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">VIN / Chasis</label>
                      <input type="text" value={vehicleForm.vin} onChange={e => setVehicleForm({...vehicleForm, vin: e.target.value})} 
                        className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Opcional" />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={() => setIsVehicleModalOpen(false)} className="px-4 py-2 rounded-lg bg-gray-100 text-sm font-medium hover:bg-gray-200">Cancelar</button>
                    <button type="submit" disabled={savingVehicle} className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
                      {savingVehicle ? "Guardando..." : (editingVehicleId ? "Guardar Cambios" : "Guardar")}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* --- Modal Confirmar Eliminación --- */}
      <Transition appear show={isDeleteModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => !deletingVehicle && setIsDeleteModalOpen(false)}>
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
                    Eliminar Vehículo
                  </Dialog.Title>
                  <div className="mt-2">
                    <p className="text-sm text-slate-500">
                      ¿Estás seguro de que quieres eliminar este vehículo? Esta acción no se puede deshacer y se perderá el historial asociado.
                    </p>
                  </div>
                </div>
                <div className="mt-6 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    className="inline-flex w-full justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-base font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none sm:text-sm transition-colors"
                    onClick={() => setIsDeleteModalOpen(false)}
                    disabled={deletingVehicle}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="inline-flex w-full justify-center rounded-lg border border-transparent bg-red-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none sm:text-sm transition-colors disabled:opacity-70"
                    onClick={confirmDeleteVehicle}
                    disabled={deletingVehicle}
                  >
                    {deletingVehicle ? "Eliminando..." : "Eliminar"}
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