// src/pages/Orders.jsx
import { useState, useEffect, Fragment } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, Transition } from "@headlessui/react";
import { apiGet, apiPatch } from "../lib/api"; // 👈 Importamos apiPatch
import AppNavbar from "../components/layout/AppNavbar";
import AppDrawer from "../components/layout/AppDrawer";
import AppFooter from "../components/layout/AppFooter";

// --- Componentes Auxiliares ---
function Badge({ status }) {
  const colors = {
    pending: "bg-slate-100 text-slate-700 border-slate-200",
    in_progress: "bg-blue-50 text-blue-700 border-blue-200",
    waiting_parts: "bg-orange-50 text-orange-700 border-orange-200",
    finished: "bg-purple-50 text-purple-700 border-purple-200",
    delivered: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };
  const labels = {
    pending: "Pendiente",
    in_progress: "En Taller",
    waiting_parts: "Esp. Repuestos",
    finished: "Terminado",
    delivered: "Entregado",
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border ${colors[status] || colors.pending}`}>
      {labels[status] || status}
    </span>
  );
}

function IconButton({ onClick, children, title }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-indigo-600 transition-colors"
    >
      {children}
    </button>
  );
}

// Badge pequeño para tipo de ítem en el detalle
function ItemTypeBadge({ text }) {
  if (text.includes("[REPUESTO]")) {
    return <span className="bg-indigo-100 text-indigo-700 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide mr-2">Repuesto</span>;
  }
  if (text.includes("[EXTERNO]")) {
    return <span className="bg-orange-100 text-orange-700 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide mr-2">Externo</span>;
  }
  return <span className="bg-slate-100 text-slate-600 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide mr-2">Labor</span>;
}

// Limpia el texto para mostrarlo más bonito
function formatDescription(text) {
  return text.replace(/\[REPUESTO\]|\[EXTERNO\]/g, "").trim();
}

export default function Orders() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [mechanics, setMechanics] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Estados Modal Edición
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [form, setForm] = useState({
    status: "",
    mechanic: "",
    internal_notes: ""
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ordersData, mechanicsData] = await Promise.all([
        apiGet("/orders/"),
        apiGet("/mechanics/") 
      ]);
      setOrders(ordersData);
      setMechanics(mechanicsData);
    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setLoading(false);
    }
  };

  const filtered = orders.filter(o => {
    const vehicle = o.evaluation_data?.vehicle_data;
    const client = o.evaluation_data?.client_data;
    const text = `${vehicle?.brand} ${vehicle?.model} ${vehicle?.plate} ${client?.first_name} ${client?.last_name} #${o.id}`.toLowerCase();
    return text.includes(search.toLowerCase());
  });

  // --- Lógica Modal ---
  const openEdit = (order) => {
    setEditingOrder(order);
    setForm({
      status: order.status,
      mechanic: order.mechanic || "", 
      internal_notes: order.internal_notes || ""
    });
    setIsEditOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!editingOrder) return;
    setSaving(true);
    try {
      // 1. Preparamos el payload corrigiendo el mecánico vacío
      const payload = { ...form };
      if (payload.mechanic === "") {
        payload.mechanic = null; // Convertimos "" a null para que el backend no falle
      }

      // 2. Usamos apiPatch en lugar de apiPut para actualización parcial
      await apiPatch(`/orders/${editingOrder.id}/`, payload);
      
      // 3. Actualización optimista local
      setOrders(prev => prev.map(o => {
        if (o.id === editingOrder.id) {
          // Buscamos el nombre del mecánico si se asignó uno
          let newMechName = null;
          if (payload.mechanic) {
             const m = mechanics.find(m => m.id === Number(payload.mechanic));
             if (m) newMechName = m.username;
          }

          return { 
            ...o, 
            ...payload, 
            mechanic_name: newMechName 
          };
        }
        return o;
      }));
      
      setIsEditOpen(false);
    } catch (error) {
      console.error(error);
      alert("Error al actualizar la orden. Revisa que los datos sean correctos.");
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("es-CL", { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <AppNavbar 
        title="Órdenes de Trabajo" 
        onOpenDrawer={() => setDrawerOpen(true)}
        onLogout={() => { localStorage.clear(); location.href = "/login"; }}
      />
      <AppDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <main className="flex-1 mx-auto max-w-7xl w-full px-4 py-8">
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Gestión de Órdenes</h1>
            <p className="text-sm text-slate-500">Administra el flujo de trabajo del taller.</p>
          </div>
          
          <div className="relative">
            <input 
              type="text"
              placeholder="Buscar OT, patente, cliente..." 
              className="w-full sm:w-72 border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <svg className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 border-b">
                <tr>
                  <th className="px-6 py-4 font-medium">#OT</th>
                  <th className="px-6 py-4 font-medium">Estado</th>
                  <th className="px-6 py-4 font-medium">Vehículo</th>
                  <th className="px-6 py-4 font-medium">Cliente</th>
                  <th className="px-6 py-4 font-medium">Mecánico</th>
                  <th className="px-6 py-4 font-medium">Ingreso</th>
                  <th className="px-6 py-4 font-medium text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan="7" className="px-6 py-8 text-center text-slate-500">Cargando órdenes...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan="7" className="px-6 py-8 text-center text-slate-500">No hay órdenes activas.</td></tr>
                ) : (
                  filtered.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4 font-mono text-slate-600 font-bold">
                        #{order.folio} {/* Usa folio, si no existe (viejos), usa ID */}
                      </td>
                      <td className="px-6 py-4"><Badge status={order.status} /></td>
                      <td className="px-6 py-4 font-medium text-slate-900">
                        <div className="text-sm">{order.evaluation_data?.vehicle_data?.brand} {order.evaluation_data?.vehicle_data?.model}</div>
                        <div className="text-xs text-slate-500 font-mono bg-slate-100 inline-block px-1 rounded border">{order.evaluation_data?.vehicle_data?.plate}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {order.evaluation_data?.client_data?.first_name} {order.evaluation_data?.client_data?.last_name}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {order.mechanic_name ? (
                          <span className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-gray-50 border border-gray-200 w-fit">
                            <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-bold">
                              {order.mechanic_name.charAt(0).toUpperCase()}
                            </div>
                            {order.mechanic_name}
                          </span>
                        ) : <span className="text-slate-400 text-xs italic">— Sin asignar —</span>}
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-xs">
                        {formatDate(order.created_at)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end">
                          <button
                            onClick={() => openEdit(order)}
                            className="text-sm bg-slate-100 text-slate-600 hover:bg-indigo-600 hover:text-white px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-2"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                              <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Gestionar
                          </button>
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

      {/* --- MODAL DE GESTIÓN AVANZADO --- */}
      <Transition appear show={isEditOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsEditOpen(false)}>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all flex flex-col max-h-[90vh]">
                
                {/* Encabezado Modal */}
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <div>
                    <Dialog.Title as="h3" className="text-lg font-bold text-slate-900">
                      Orden de Trabajo #{editingOrder?.id}
                    </Dialog.Title>
                    <p className="text-xs text-slate-500">
                      Creada el {formatDate(editingOrder?.created_at)}
                    </p>
                  </div>
                  <button onClick={() => setIsEditOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                
                <div className="p-6 overflow-y-auto">
                  <form onSubmit={handleSave} className="space-y-6">
                    
                    {/* 1. INFO VEHÍCULO (Solo lectura) */}
                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs uppercase font-bold text-blue-800 opacity-70">Vehículo</label>
                        <div className="font-semibold text-slate-800">
                          {editingOrder?.evaluation_data?.vehicle_data?.brand} {editingOrder?.evaluation_data?.vehicle_data?.model}
                        </div>
                        <div className="text-sm text-slate-600">Patente: {editingOrder?.evaluation_data?.vehicle_data?.plate}</div>
                      </div>
                      <div>
                        <label className="text-xs uppercase font-bold text-blue-800 opacity-70">Cliente</label>
                        <div className="font-semibold text-slate-800">
                          {editingOrder?.evaluation_data?.client_data?.first_name} {editingOrder?.evaluation_data?.client_data?.last_name}
                        </div>
                        <div className="text-sm text-slate-600">{editingOrder?.evaluation_data?.client_data?.phone || "Sin teléfono"}</div>
                      </div>
                    </div>

                    {/* 2. TABLA DE TRABAJOS A REALIZAR */}
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
                        <svg viewBox="0 0 24 24" className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                        Detalle del Trabajo Aprobado
                      </h4>
                      <div className="border border-slate-200 rounded-lg overflow-hidden">
                        <table className="w-full text-sm text-left">
                          <thead className="bg-slate-50 text-slate-500 font-semibold border-b">
                            <tr>
                              <th className="px-4 py-2">Descripción</th>
                              <th className="px-4 py-2 text-right w-24">Costo</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {editingOrder?.evaluation_data?.items
                              ?.filter(item => item.is_approved) // Solo mostramos lo aprobado
                              .map((item, idx) => (
                              <tr key={idx}>
                                <td className="px-4 py-2 text-slate-700">
                                  <ItemTypeBadge text={item.description} />
                                  {formatDescription(item.description)}
                                </td>
                                <td className="px-4 py-2 text-right text-slate-600">
                                  ${Number(item.price).toLocaleString("es-CL")}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="bg-slate-50 font-bold text-slate-800">
                            <tr>
                              <td className="px-4 py-2 text-right">Total Aprobado:</td>
                              <td className="px-4 py-2 text-right">
                                ${editingOrder?.evaluation_data?.items
                                  ?.filter(i => i.is_approved)
                                  .reduce((sum, i) => sum + Number(i.price), 0)
                                  .toLocaleString("es-CL")}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>

                    <hr className="border-slate-200" />

                    {/* 3. GESTIÓN (Inputs) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Estado actual</label>
                        <div className="relative">
                          <select 
                            className="w-full appearance-none border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-medium text-slate-700"
                            value={form.status}
                            onChange={e => setForm({...form, status: e.target.value})}
                          >
                            <option value="pending">⏳ Pendiente</option>
                            <option value="in_progress">🔧 En Reparación</option>
                            <option value="waiting_parts">📦 Esperando Repuestos</option>
                            <option value="finished">✅ Terminado</option>
                            <option value="delivered">🚀 Entregado</option>
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Mecánico Asignado</label>
                        <div className="relative">
                          <select 
                            className="w-full appearance-none border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                            value={form.mechanic}
                            onChange={e => setForm({...form, mechanic: e.target.value})}
                          >
                            <option value="">-- Sin asignar --</option>
                            {mechanics.map(m => (
                              // ✅ CORRECCIÓN ROL: Usamos m.role directamente porque viene formateado del backend
                              <option key={m.id} value={m.id}>{m.username} ({m.role})</option>
                            ))}
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Notas Internas / Instrucciones</label>
                      <textarea 
                        rows="3"
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        placeholder="Escribe instrucciones específicas para el mecánico o notas sobre el avance..."
                        value={form.internal_notes}
                        onChange={e => setForm({...form, internal_notes: e.target.value})}
                      />
                    </div>

                    {/* Footer Modal */}
                    <div className="flex justify-end gap-3 pt-2">
                      <button 
                        type="button" 
                        onClick={() => setIsEditOpen(false)} 
                        className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-bold hover:bg-slate-200 transition-colors"
                      >
                        Cancelar
                      </button>
                      <button 
                        type="submit" 
                        disabled={saving}
                        className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {saving ? "Guardando..." : "Guardar Cambios"}
                      </button>
                    </div>

                  </form>
                </div>
              </Dialog.Panel>
            </div>
          </div>
        </Dialog>
      </Transition>

    </div>
  );
}