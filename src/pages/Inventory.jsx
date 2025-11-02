// src/pages/Inventory.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiGet, apiPost, apiPut, apiDelete } from "../lib/api";
import AppNavbar from "../components/layout/AppNavbar";
import AppDrawer from "../components/layout/AppDrawer";
import AppFooter from "../components/layout/AppFooter";

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
          <button onClick={onClose} className="rounded-lg border px-4 py-2 text-sm hover:bg-slate-50">Cancelar</button>
          <button onClick={onSubmit} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
            {submitText}
          </button>
        </div>
      </div>
    </div>
  );
}

const STATUS = { active: "Activo", inactive: "Inactivo", out: "Sin stock" };
const STATUS_FROM_LABEL = { Activo: "active", Inactivo: "inactive", "Sin stock": "out" };

export default function Inventory() {
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [items, setItems] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [q, setQ] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: "", sku: "", quantity: 0, price: 0, category: "", location: "", status: "Activo",
  });
  const [saving, setSaving] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  async function loadInventory() {
    setLoadingList(true);
    try {
      const data = await apiGet("/inventory/");
      const norm = data.map(i => ({
        id: i.id,
        name: i.name,
        sku: i.sku,
        quantity: i.quantity,
        price: Number(i.price),
        category: i.category || "",
        location: i.location || "",
        status: STATUS[i.status] || "Activo",
      }));
      setItems(norm);
    } catch (e) {
      console.error(e);
      alert("No se pudo cargar el inventario.");
    } finally {
      setLoadingList(false);
    }
  }
  useEffect(() => { loadInventory(); }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((i) =>
      i.name.toLowerCase().includes(s) ||
      i.sku.toLowerCase().includes(s) ||
      i.category.toLowerCase().includes(s) ||
      i.location.toLowerCase().includes(s) ||
      String(i.quantity).includes(s)
    );
  }, [q, items]);

  function openAdd() {
    setErrMsg("");
    setForm({ name: "", sku: "", quantity: 0, price: 0, category: "", location: "", status: "Activo" });
    setEditing(null);
    setModalOpen(true);
  }
  function openEdit(id) {
    const it = items.find((x) => x.id === id);
    if (!it) return;
    setErrMsg("");
    setForm({ ...it }); // ya está en labels
    setEditing(it.id);
    setModalOpen(true);
  }

  async function saveForm() {
    if (!form.name.trim() || !form.sku.trim()) {
      setErrMsg("Nombre y SKU son obligatorios.");
      return;
    }
    if (form.quantity < 0) return setErrMsg("Cantidad no puede ser negativa.");
    if (form.price < 0) return setErrMsg("Precio no puede ser negativo.");

    setSaving(true);
    try {
      const payload = {
        name: form.name,
        sku: form.sku,
        quantity: Number(form.quantity),
        price: Number(form.price),
        category: form.category,
        location: form.location,
        status: STATUS_FROM_LABEL[form.status] || "active",
      };
      if (editing) {
        await apiPut(`/inventory/${editing}/`, payload);
      } else {
        await apiPost("/inventory/", payload);
      }
      setModalOpen(false);
      await loadInventory();
    } catch (e) {
      console.error(e);
      setErrMsg("No se pudo guardar el producto.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id) {
    if (!confirm("¿Eliminar este producto?")) return;
    try {
      await apiDelete(`/inventory/${id}/`);
      setItems((arr) => arr.filter((i) => i.id !== id));
    } catch (e) {
      console.error(e);
      alert("No se pudo eliminar el producto.");
    }
  }

  const drawerItems = [
    { label: "Órdenes", onClick: () => navigate("/dashboard") },
    { label: "Inventario", onClick: () => navigate("/inventory") },
    { label: "Externalización", onClick: () => navigate("/external") },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <AppNavbar
        title="Inventario"
        onOpenDrawer={() => setDrawerOpen(true)}
        onLogout={() => { localStorage.clear(); location.href = "/login"; }}
        onAlerts={() => alert("Aquí irían tus alertas 😉")}
      />

      <AppDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} items={drawerItems} />

      <main className="flex-1 mx-auto max-w-7xl w-full px-4 py-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Productos</h1>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
            <div className="relative">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar por nombre, SKU, categoría, ubicación…"
                className="w-full sm:w-96 rounded-lg border border-slate-300 px-3 py-2 pl-9 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-slate-400">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="7" />
                  <path d="M21 21l-4.3-4.3" />
                </svg>
              </span>
            </div>
            <PrimaryButton title="Agregar producto" onClick={openAdd}>
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14" />
              </svg>
              <span>Agregar</span>
            </PrimaryButton>
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border bg-white shadow-sm">
          <div className="hidden md:grid grid-cols-12 gap-4 border-b bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-500">
            <div className="col-span-3">Nombre</div>
            <div className="col-span-2">SKU</div>
            <div className="col-span-2">Cantidad</div>
            <div className="col-span-2">Precio</div>
            <div className="col-span-2">Estado</div>
            <div className="col-span-1 text-right pr-1">Acciones</div>
          </div>

          {loadingList && <div className="px-4 py-8 text-center text-sm text-slate-500">Cargando…</div>}

          <ul className="divide-y">
            {filtered.map((p) => (
              <li key={p.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 px-4 py-4">
                <div className="md:col-span-3">
                  <div className="font-medium">{p.name}</div>
                  <div className="text-xs text-slate-500">Cat: {p.category || "—"} · Ubicación: {p.location || "—"}</div>
                </div>
                <div className="md:col-span-2 text-slate-700">{p.sku}</div>
                <div className="md:col-span-2 text-slate-700">{p.quantity}</div>
                {/* ----- ⬇️ AQUÍ ESTÁ EL CAMBIO ⬇️ ----- */}
                <div className="md:col-span-2 text-slate-700">${p.price.toLocaleString('es-CL', { maximumFractionDigits: 0 })}</div>
                {/* ----- ⬆️ AQUÍ ESTÁ EL CAMBIO ⬆️ ----- */}
                <div className="md:col-span-2">
                  <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                    p.status === "Activo" ? "bg-emerald-100 text-emerald-700"
                    : p.status === "Sin stock" ? "bg-rose-100 text-rose-700"
                    : "bg-slate-100 text-slate-700"
                  }`}>
                    {p.status}
                  </span>
                </div>
                <div className="md:col-span-1 flex items-center justify-end gap-2">
                  <IconButton title="Editar" onClick={() => openEdit(p.id)} className="px-2 py-1">
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z" />
                    </svg>
                  </IconButton>
                  <IconButton title="Eliminar" onClick={() => remove(p.id)} className="px-2 py-1">
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
              <li className="px-4 py-8 text-center text-sm text-slate-500">No hay resultados para “{q}”.</li>
            )}
          </ul>
        </div>
      </main>

      <AppFooter />

      {/* Modal crear/editar */}
      <Modal
        open={modalOpen}
        title={editing ? "Editar producto" : "Agregar producto"}
        onClose={() => setModalOpen(false)}
        onSubmit={saveForm}
        submitText={saving ? "Guardando..." : editing ? "Guardar cambios" : "Crear producto"}
      >
        {errMsg && <div className="mb-3 rounded bg-red-100 text-red-700 px-3 py-2 text-sm">{errMsg}</div>}
        <div className="grid gap-4">
          <div>
            <label className="block text-sm text-slate-700 mb-1">Nombre</label>
            <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                   className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-700 mb-1">SKU</label>
              <input value={form.sku} onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
                     className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
            <div>
              <label className="block text-sm text-slate-700 mb-1">Cantidad</label>
              <input type="number" min="0" value={form.quantity}
                onChange={(e) => setForm((f) => ({ ...f, quantity: Number(e.target.value) }))}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-700 mb-1">Precio</label>
              <input type="number" min="0" step="0.01" value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
            <div>
              <label className="block text-sm text-slate-700 mb-1">Estado</label>
              <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value })) }
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
                <option>Activo</option>
                <option>Inactivo</option>
                <option>Sin stock</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-700 mb-1">Categoría</label>
              <input value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                     className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
            <div>
              <label className="block text-sm text-slate-700 mb-1">Ubicación</label>
              <input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                     className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}