import { useEffect, useMemo, useState } from "react";
import { apiGet, apiPost, apiPut, apiDelete } from "../lib/api";
import { useNavigate, Link } from "react-router-dom";
import AppNavbar from "../components/layout/AppNavbar";
import AppDrawer from "../components/layout/AppDrawer";
import AppFooter from "../components/layout/AppFooter";

/* Helpers UI que siguen siendo locales al dashboard */
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
function Modal({ open, title, onClose, onSubmit, children, submitText = "Guardar" }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
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

/* Mapeo de estados (API <-> UI) */
const STATUS = { pending: "Pendiente", in_progress: "En curso", done: "Completado" };
const STATUS_FROM_LABEL = { Pendiente: "pending", "En curso": "in_progress", Completado: "done" };

export default function DashBoard() {
  const navigate = useNavigate(); 
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [q, setQ] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ cliente: "", vehiculo: "", servicio: "", estado: "Pendiente" });
  const [saving, setSaving] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  // Cargar órdenes
  async function loadOrders() {
    setLoadingList(true);
    try {
      const data = await apiGet("/orders/");
      const normalized = data.map((o) => ({
        id: o.id,
        cliente: o.client,
        vehiculo: o.vehicle,
        servicio: o.service,
        estado: STATUS[o.status] || "Pendiente",
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

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return orders;
    return orders.filter(
      (o) =>
        o.cliente.toLowerCase().includes(s) ||
        o.vehiculo.toLowerCase().includes(s) ||
        o.servicio.toLowerCase().includes(s) ||
        o.estado.toLowerCase().includes(s)
    );
  }, [q, orders]);

  function openAdd() {
    setErrMsg("");
    setForm({ cliente: "", vehiculo: "", servicio: "", estado: "Pendiente" });
    setEditing(null);
    setModalOpen(true);
  }
  function openEdit(id) {
    const o = orders.find((x) => x.id === id);
    if (!o) return;
    setErrMsg("");
    setForm({ cliente: o.cliente, vehiculo: o.vehiculo, servicio: o.servicio, estado: o.estado });
    setEditing(o.id);
    setModalOpen(true);
  }

  async function saveForm() {
    if (!form.cliente.trim() || !form.vehiculo.trim() || !form.servicio.trim()) {
      setErrMsg("Completa cliente, vehículo y servicio.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        client: form.cliente,
        vehicle: form.vehiculo,
        service: form.servicio,
        status: STATUS_FROM_LABEL[form.estado] || "pending",
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
      setErrMsg("No se pudo guardar la orden.");
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

  // Handlers Navbar
  const handleLogout = () => {
    localStorage.clear();
    location.href = "/login";
  };
  const handleAlerts = () => alert("Aquí irían tus alertas 😉");

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
          { label: "Órdenes", onClick: () => navigate("/dashboard") },
          { label: "Inventario", onClick: () => navigate("/inventory") },
          { label: "Clientes", onClick: () => alert("en construcción") },
          { label: "Servicios", onClick: () => alert("en construcción") },
          { label: "Externalización", onClick: () => navigate("/external") },
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
                placeholder="Buscar por cliente, vehículo, servicio…"
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

        <div className="mt-4 overflow-hidden rounded-2xl border bg-white shadow-sm">
          <div className="hidden md:grid grid-cols-12 gap-4 border-b bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-500">
            <div className="col-span-3">Cliente</div>
            <div className="col-span-3">Vehículo</div>
            <div className="col-span-3">Servicio</div>
            <div className="col-span-2">Estado</div>
            <div className="col-span-1 text-right pr-1">Acciones</div>
          </div>

          {loadingList && (
            <div className="px-4 py-8 text-center text-sm text-slate-500">Cargando…</div>
          )}

          <ul className="divide-y">
            {filtered.map((o) => (
              <li key={o.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 px-4 py-4">
                <div className="md:col-span-3">
                  <div className="font-medium">{o.cliente}</div>
                  <div className="md:hidden text-xs text-slate-500">{o.vehiculo}</div>
                </div>
                <div className="hidden md:block md:col-span-3 text-slate-700">{o.vehiculo}</div>
                <div className="md:col-span-3 text-slate-700">{o.servicio}</div>
                <div className="md:col-span-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                      o.estado === "Completado"
                        ? "bg-emerald-100 text-emerald-700"
                        : o.estado === "En curso"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {o.estado}
                  </span>
                </div>
                <div className="md:col-span-1 flex items-center justify-end gap-2">
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
              </li>
            ))}
            {!loadingList && filtered.length === 0 && (
              <li className="px-4 py-8 text-center text-sm text-slate-500">
                No hay resultados para “{q}”.
              </li>
            )}
          </ul>
        </div>
      </main>

      {/* FOOTER */}
      <AppFooter />

      {/* Modal agregar/editar */}
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
        <div className="grid gap-4">
          <div>
            <label className="block text-sm text-slate-700 mb-1">Cliente</label>
            <input
              value={form.cliente}
              onChange={(e) => setForm((f) => ({ ...f, cliente: e.target.value }))}
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-700 mb-1">Vehículo</label>
            <input
              value={form.vehiculo}
              onChange={(e) => setForm((f) => ({ ...f, vehiculo: e.target.value }))}
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-700 mb-1">Servicio</label>
            <input
              value={form.servicio}
              onChange={(e) => setForm((f) => ({ ...f, servicio: e.target.value }))}
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-700 mb-1">Estado</label>
            <select
              value={form.estado}
              onChange={(e) => setForm((f) => ({ ...f, estado: e.target.value }))}
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option>Pendiente</option>
              <option>En curso</option>
              <option>Completado</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
}
