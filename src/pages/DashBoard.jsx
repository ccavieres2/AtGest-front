// src/pages/DashBoard.jsx
import { useEffect, useMemo, useState } from "react";
import { apiGet, apiPost, apiPut, apiDelete } from "../lib/api";
import { useNavigate, Link } from "react-router-dom";
import AppNavbar from "../components/layout/AppNavbar";
import AppDrawer from "../components/layout/AppDrawer";
import AppFooter from "../components/layout/AppFooter";

// --- Helpers UI ---

function IconButton({ title, onClick, children, className = "" }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-slate-50 ${className}`}
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
      className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 text-white px-4 py-2 text-sm font-semibold hover:bg-indigo-700"
    >
      {children}
    </button>
  );
}

// --- Modal para Editar/Crear ---

function Modal({ open, title, onClose, onSubmit, children, submitText = "Guardar" }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <button onClick={onClose} className="rounded p-1 hover:bg-slate-100" title="Cerrar">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        <div className="mt-4">{children}</div>
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border px-4 py-2 text-sm hover:bg-slate-50">
            Cancelar
          </button>
          <button
            onClick={onSubmit}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            {submitText}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- ⭐️ NUEVO: Modal de solo lectura para Ver Detalle ⭐️ ---

function ViewOrderModal({ order, onClose }) {
  if (!order) return null;

  // Helper para formatear moneda (con las correcciones que hicimos)
  const formatCurrency = (val) => {
    const num = Number(val);
    if (isNaN(num)) return "$0"; // Maneja NaN si 'val' no es numérico
    return "$" + num.toLocaleString('es-CL', { maximumFractionDigits: 0 });
  };
  
  // Helper para formatear fechas
  const formatDate = (dateStr) => {
     if (!dateStr) return "No definida";
     // Asegura que la fecha se interprete como local, no UTC
     const datePart = dateStr.split('T')[0];
     // Sumamos 1 día porque al parsear YYYY-MM-DD puede tomar el día anterior por zona horaria
     const date = new Date(datePart);
     date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
     return date.toLocaleDateString('es-CL', {
        year: 'numeric', month: 'long', day: 'numeric'
     });
  };

  // Helper para filas de detalles
  const DetailRow = ({ label, value, className = "" }) => (
    <div className={className}>
      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</div>
      <div className="text-base text-slate-900">{value || "—"}</div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Encabezado */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">
            Detalle Orden #{order.id}
          </h3>
          <button onClick={onClose} className="rounded p-1 hover:bg-slate-100" title="Cerrar">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        {/* Contenido */}
        <div className="mt-6 space-y-6">
          {/* Estado */}
          <div>
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-bold ${
                order.status === "Completado" ? "bg-emerald-100 text-emerald-700"
                : order.status === "En Taller" ? "bg-amber-100 text-amber-700"
                : order.status === "Cancelado" ? "bg-red-100 text-red-700"
                : "bg-slate-100 text-slate-700"
              }`}
            >
              {order.status}
            </span>
          </div>

          {/* Cliente */}
          <fieldset>
            <legend className="text-base font-semibold text-slate-800 mb-2 border-b pb-1">Cliente</legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DetailRow label="Nombre" value={order.client_name} />
              <DetailRow label="Teléfono" value={order.client_phone} />
              <DetailRow label="Email" value={order.client_email} className="sm:col-span-2" />
            </div>
          </fieldset>

          {/* Vehículo */}
          <fieldset>
            <legend className="text-base font-semibold text-slate-800 mb-2 border-b pb-1">Vehículo</legend>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <DetailRow label="Marca" value={order.vehicle_make} />
              <DetailRow label="Modelo" value={order.vehicle_model} />
              <DetailRow label="Año" value={order.vehicle_year} />
              <DetailRow label="Patente" value={order.vehicle_plate} />
              <DetailRow label="VIN (Chasis)" value={order.vehicle_vin} className="sm:col-span-2" />
            </div>
          </fieldset>

          {/* Servicio y Costos */}
          <fieldset>
            <legend className="text-base font-semibold text-slate-800 mb-2 border-b pb-1">Servicio y Costos</legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DetailRow label="Título del Servicio" value={order.service_title} className="sm:col-span-2" />
              <DetailRow label="Descripción / Notas" value={order.service_description} className="sm:col-span-2" />
              <DetailRow label="Fecha Agendada" value={formatDate(order.scheduled_date)} />
              <div /> {/* Espacio vacío */}
              <DetailRow label="Costo Estimado" value={formatCurrency(order.estimated_cost)} />
              <DetailRow label="Costo Final" value={formatCurrency(order.final_cost)} />
            </div>
          </fieldset>
        </div>

        {/* Pie de página */}
        <div className="mt-8 pt-4 border-t flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
// --- ⭐️ FIN DEL NUEVO MODAL ⭐️ ---


/* Mapeo de estados (API <-> UI) */
const STATUS = {
  pending: "Pendiente",
  awaiting_approval: "Esperando Aprobación",
  in_progress: "En Taller",
  awaiting_parts: "Esperando Repuestos",
  done: "Completado",
  cancelled: "Cancelado",
};
const STATUS_FROM_LABEL = {
  "Pendiente": "pending",
  "Esperando Aprobación": "awaiting_approval",
  "En Taller": "in_progress",
  "Esperando Repuestos": "awaiting_parts",
  "Completado": "done",
  "Cancelado": "cancelled",
};
const STATUS_OPTIONS = Object.keys(STATUS_FROM_LABEL);

const EMPTY_FORM = {
  client_name: "",
  client_phone: "",
  client_email: "",
  vehicle_plate: "",
  vehicle_make: "",
  vehicle_model: "",
  vehicle_year: "",
  vehicle_vin: "",
  service_title: "",
  service_description: "",
  estimated_cost: 0,
  final_cost: "", 
  scheduled_date: "",
  status: "Pendiente",
};


export default function DashBoard() {
  const navigate = useNavigate(); 
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [q, setQ] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  // --- ⭐️ NUEVO: Estado para el modal de "Ver Detalle" ⭐️ ---
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewingOrder, setViewingOrder] = useState(null);
  // --- -------------------------------------------------- ---

  // Cargar órdenes
  async function loadOrders() {
    setLoadingList(true);
    try {
      const data = await apiGet("/orders/");
      const normalized = data.map((o) => ({
        id: o.id,
        client_name: o.client_name,
        client_phone: o.client_phone || "",
        client_email: o.client_email || "",
        vehicle_plate: o.vehicle_plate || "",
        vehicle_make: o.vehicle_make || "",
        vehicle_model: o.vehicle_model,
        vehicle_year: o.vehicle_year || "",
        vehicle_vin: o.vehicle_vin || "",
        service_title: o.service_title,
        service_description: o.service_description || "",
        
        // CORRECCIÓN: Convertir a Número al cargar
        estimated_cost: Number(o.estimated_cost) || 0,
        final_cost: Number(o.final_cost) || 0,

        scheduled_date: o.scheduled_date ? o.scheduled_date.split('T')[0] : "", // Formato YYYY-MM-DD
        status: STATUS[o.status] || "Pendiente", // Convertir a Label
        created_at: o.created_at,
      }));
      setOrders(normalized);
    } catch (e) {
      console.error(e);
      alert("No se pudieron cargar las órdenes.");
    } finally {
      setLoadingList(false);
    }
  }
  useEffect(() => { loadOrders(); }, []);

  // Filtro
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return orders;
    return orders.filter(
      (o) =>
        o.client_name.toLowerCase().includes(s) ||
        o.client_phone.toLowerCase().includes(s) ||
        o.vehicle_plate.toLowerCase().includes(s) ||
        o.vehicle_make.toLowerCase().includes(s) ||
        o.vehicle_model.toLowerCase().includes(s) ||
        o.service_title.toLowerCase().includes(s) ||
        o.status.toLowerCase().includes(s)
    );
  }, [q, orders]);

  // --- ⭐️ NUEVO: Funciones para abrir/cerrar el modal de "Ver Detalle" ⭐️ ---
  function openView(id) {
    const o = orders.find((x) => x.id === id);
    if (!o) return;
    setViewingOrder(o);
    setViewModalOpen(true);
  }

  function closeView() {
    setViewModalOpen(false);
    // Pequeño delay para que la animación de salida ocurra antes de quitar los datos
    setTimeout(() => setViewingOrder(null), 300); 
  }
  // --- ------------------------------------------------------------- ---


  // Funciones para modal Editar/Crear
  function openAdd() {
    setErrMsg("");
    setForm(EMPTY_FORM);
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(id) {
    const o = orders.find((x) => x.id === id);
    if (!o) return;
    setErrMsg("");
    // Hacemos una copia para el formulario
    setForm({
      ...o,
      // Convertimos 0 a string vacío para los inputs
      final_cost: o.final_cost === 0 ? "" : o.final_cost,
      estimated_cost: o.estimated_cost === 0 ? "" : o.estimated_cost,
    });
    setEditing(o.id);
    setModalOpen(true);
  }

  async function saveForm() {
    if (!form.client_name.trim() || !form.vehicle_model.trim() || !form.service_title.trim()) {
      setErrMsg("Nombre Cliente, Modelo Vehículo y Título Servicio son obligatorios.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        client_name: form.client_name,
        client_phone: form.client_phone || null,
        client_email: form.client_email || null,
        vehicle_plate: form.vehicle_plate || null,
        vehicle_make: form.vehicle_make || null,
        vehicle_model: form.vehicle_model,
        vehicle_year: form.vehicle_year ? Number(form.vehicle_year) : null,
        vehicle_vin: form.vehicle_vin || null,
        service_title: form.service_title,
        service_description: form.service_description || null,
        estimated_cost: form.estimated_cost ? Number(form.estimated_cost) : 0,
        final_cost: form.final_cost ? Number(form.final_cost) : null,
        scheduled_date: form.scheduled_date || null,
        status: STATUS_FROM_LABEL[form.status] || "pending",
      };

      if (editing) {
        await apiPut(`/orders/${editing}/`, payload);
      } else {
        await apiPost("/orders/", payload);
      }
      setModalOpen(false);
      await loadOrders();
    } catch (e) {
      console.error(e);
      setErrMsg("No se pudo guardar la orden. Revisa los campos.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id) {
    if (!confirm("¿Eliminar esta orden?")) return;
    try {
      await apiDelete(`/orders/${id}/`);
      setOrders((arr) => arr.filter((o) => o.id !== id));
    } catch (e) {
      console.error(e);
      alert("No se pudo eliminar la orden.");
    }
  }

  // Handlers
  const handleLogout = () => {
    localStorage.clear();
    location.href = "/login";
  };
  const handleAlerts = () => alert("Aquí irían tus alertas 😉");

  const onFormChange = (e) => {
    const { name, value, type } = e.target;
    setForm((f) => ({
      ...f,
      [name]: type === 'number' ? (value === '' ? '' : Number(value)) : value,
    }));
  };
  const onDateChange = (e) => {
     setForm((f) => ({ ...f, [e.target.name]: e.target.value || null }));
  }

  // Definición de iconos
  const iconOrders = (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
      <path d="M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
      <path d="m9 14 2 2 4-4"/>
    </svg>
  );
  const iconInventory = (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0l-2 5H6l-2-5m16 0s-2 5-6 5-6-5-6-5"/>
    </svg>
  );
  const iconExternal = (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
      <path d="m15 3 6 6m0-6v6h-6"/>
    </svg>
  );


  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* NAVBAR */}
      <AppNavbar
        title="Dashboard"
        onOpenDrawer={() => setDrawerOpen(true)}
        onLogout={handleLogout}
        onAlerts={handleAlerts}
      />

      {/* DRAWER */}
      <AppDrawer   open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        items={[
          { label: "Órdenes", onClick: () => navigate("/dashboard"), icon: iconOrders },
          { label: "Inventario", onClick: () => navigate("/inventory"), icon: iconInventory },
          { label: "Externalización", onClick: () => navigate("/external"), icon: iconExternal },
        ]}/>

      {/* CONTENIDO */}
      <main className="flex-1 mx-auto max-w-7xl w-full px-4 py-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Órdenes</h1>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
            <div className="relative">
              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar por cliente, patente, modelo, servicio…" 
                className="w-full sm:w-80 rounded-lg border border-slate-300 px-3 py-2 pl-9 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-slate-400">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="7" />
                  <path d="M21 21l-4.3-4.3" />
                </svg>
              </span>
            </div>
            <PrimaryButton title="Agregar orden" onClick={openAdd}>
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14" />
              </svg>
              <span>Agregar orden</span>
            </PrimaryButton>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto rounded-2xl border bg-white shadow-sm">
          <table className="w-full min-w-[800px]">
            <thead className="border-b bg-slate-50 text-xs font-semibold text-slate-500 uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Cliente</th>
                <th className="px-4 py-3 text-left">Vehículo</th>
                <th className="px-4 py-3 text-left">Servicio</th>
                <th className="px-4 py-3 text-left">Costos</th>
                <th className="px-4 py-3 text-left">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y text-sm">
              {loadingList && (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-slate-500">Cargando…</td>
                </tr>
              )}
              {!loadingList && filtered.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-slate-500">
                    No hay resultados para “{q}”.
                  </td>
                </tr>
              )}
              {filtered.map((o) => (
                <tr key={o.id}>
                  <td className="px-4 py-3 align-top">
                    <div className="font-medium">{o.client_name}</div>
                    <div className="text-xs text-slate-500">{o.client_phone}</div>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="font-medium">{o.vehicle_make} {o.vehicle_model} ({o.vehicle_year})</div>
                    <div className="text-xs text-slate-500">{o.vehicle_plate}</div>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="font-medium">{o.service_title}</div>
                  </td>
                  <td className="px-4 py-3 align-top">
                    {/* Formato de moneda chilena (corregido) */}
                    <div className="text-xs text-slate-500">Est: ${o.estimated_cost.toLocaleString('es-CL', { maximumFractionDigits: 0 })}</div>
                    <div className="font-medium">${o.final_cost.toLocaleString('es-CL', { maximumFractionDigits: 0 })}</div>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        o.status === "Completado" ? "bg-emerald-100 text-emerald-700"
                        : o.status === "En Taller" ? "bg-amber-100 text-amber-700"
                        : o.status === "Cancelado" ? "bg-red-100 text-red-700"
                        : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {o.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 align-top text-right">
                    {/* --- ⭐️ NUEVO: Botón "Ver Detalle" ⭐️ --- */}
                    <div className="flex items-center justify-end gap-2">
                      <IconButton title="Ver Detalle" onClick={() => openView(o.id)} className="px-2 py-1">
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      </IconButton>
                      {/* --- --------------------------- --- */}
                      <IconButton title="Editar" onClick={() => openEdit(o.id)} className="px-2 py-1">
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 20h9" />
                          <path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z" />
                        </svg>
                      </IconButton>
                      <IconButton title="Eliminar" onClick={() => remove(o.id)} className="px-2 py-1">
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 6h18" />
                          <path d="M8 6v14a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6" />
                          <path d="M10 11v6M14 11v6" />
                        </svg>
                      </IconButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {/* FOOTER */}
      <AppFooter />

      {/* MODAL EDITAR/CREAR */}
      <Modal
        open={modalOpen}
        title={editing ? "Editar orden" : "Agregar orden"}
        onClose={() => setModalOpen(false)}
        onSubmit={saveForm}
        submitText={saving ? "Guardando..." : editing ? "Guardar cambios" : "Crear orden"}
      >
         {errMsg && (
          <div className="mb-3 rounded bg-red-100 text-red-700 px-3 py-2 text-sm">{errMsg}</div>
        )}
        
        <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
          
          <fieldset className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <legend className="text-base font-semibold text-slate-800 mb-2 col-span-full">Información del Cliente</legend>
            <div>
              <label className="block text-sm text-slate-700 mb-1">Nombre Cliente*</label>
              <input name="client_name" value={form.client_name} onChange={onFormChange}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
            <div>
              <label className="block text-sm text-slate-700 mb-1">Teléfono</label>
              <input name="client_phone" value={form.client_phone} onChange={onFormChange}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm text-slate-700 mb-1">Email</label>
              <input name="client_email" type="email" value={form.client_email} onChange={onFormChange}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
          </fieldset>
          
          <fieldset className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <legend className="text-base font-semibold text-slate-800 mb-2 col-span-full">Información del Vehículo</legend>
            <div>
              <label className="block text-sm text-slate-700 mb-1">Patente</label>
              <input name="vehicle_plate" value={form.vehicle_plate} onChange={onFormChange}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
            <div>
              <label className="block text-sm text-slate-700 mb-1">Marca</label>
              <input name="vehicle_make" value={form.vehicle_make} onChange={onFormChange}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
            <div>
              <label className="block text-sm text-slate-700 mb-1">Modelo*</label>
              <input name="vehicle_model" value={form.vehicle_model} onChange={onFormChange}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
            <div>
              <label className="block text-sm text-slate-700 mb-1">Año</label>
              <input name="vehicle_year" type="number" value={form.vehicle_year} onChange={onFormChange}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm text-slate-700 mb-1">VIN (Chasis)</label>
              <input name="vehicle_vin" value={form.vehicle_vin} onChange={onFormChange}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
          </fieldset>

          <fieldset>
             <legend className="text-base font-semibold text-slate-800 mb-2 col-span-full">Servicio y Costos</legend>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm text-slate-700 mb-1">Título Servicio*</label>
                <input name="service_title" value={form.service_title} onChange={onFormChange}
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm text-slate-700 mb-1">Notas / Descripción del Problema</label>
                <textarea name="service_description" value={form.service_description} onChange={onFormChange} rows={3}
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              </div>
              <div>
                <label className="block text-sm text-slate-700 mb-1">Costo Estimado</label>
                <input name="estimated_cost" type="number" min="0" step="100" value={form.estimated_cost} onChange={onFormChange}
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              </div>
              <div>
                <label className="block text-sm text-slate-700 mb-1">Costo Final</label>
                <input name="final_cost" type="number" min="0" step="100" value={form.final_cost} onChange={onFormChange}
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              </div>
              <div>
                <label className="block text-sm text-slate-700 mb-1">Fecha Agendada</label>
                <input name="scheduled_date" type="date" value={form.scheduled_date || ''} onChange={onDateChange}
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              </div>
               <div>
                <label className="block text-sm text-slate-700 mb-1">Estado</label>
                <select name="status" value={form.status} onChange={onFormChange}
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
                  {STATUS_OPTIONS.map(opt => <option key={opt}>{opt}</option>)}
                </select>
              </div>
             </div>
          </fieldset>

        </form>
      </Modal>

      {/* --- ⭐️ NUEVO: Renderizar el modal de "Ver Detalle" ⭐️ --- */}
      <ViewOrderModal
        order={viewingOrder}
        onClose={closeView}
      />
    </div>
  );
}