// src/pages/Inventory.jsx
import { useEffect, useMemo, useState, Fragment } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, Transition } from "@headlessui/react";
import { apiGet, apiPost, apiPut, apiDelete } from "../lib/api";
import AppNavbar from "../components/layout/AppNavbar";
import AppDrawer from "../components/layout/AppDrawer";
import AppFooter from "../components/layout/AppFooter";

// --- Componentes Auxiliares ---
function IconButton({ onClick, className = "", children, title, disabled }) {
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

function PrimaryButton({ title, onClick, children, disabled }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 shadow-sm transition-all disabled:opacity-50"
    >
      {children}
    </button>
  );
}

// Modal Genérico para Formularios
function Modal({ open, title, onClose, onSubmit, children, submitText = "Guardar" }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl transition-all">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          <button onClick={onClose} className="rounded p-1 hover:bg-slate-100 text-slate-500">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="mt-2">{children}</div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancelar</button>
          <button onClick={onSubmit} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 shadow-sm">
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

  // Estados Modal Formulario
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", sku: "", quantity: 0, price: 0, category: "", location: "", status: "Activo" });
  const [saving, setSaving] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  
  // Estados Modal Eliminación
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
      i.location.toLowerCase().includes(s)
    );
  }, [q, items]);

  // Funciones Modal Formulario
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
    setForm({ ...it });
    setEditing(it.id);
    setModalOpen(true);
  }

  // Lógica Guardar
  async function saveForm() {
    if (!form.name.trim() || !form.sku.trim()) return setErrMsg("Nombre y SKU son obligatorios.");
    if (form.quantity < 0) return setErrMsg("Cantidad no puede ser negativa.");
    
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
      setErrMsg("Error al guardar.");
    } finally {
      setSaving(false);
    }
  }

  // Funciones Eliminación
  const openDeleteModal = (item) => {
    setItemToDelete(item);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      await apiDelete(`/inventory/${itemToDelete.id}/`);
      setItems((arr) => arr.filter((i) => i.id !== itemToDelete.id));
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
    } catch (e) {
      alert("Error al eliminar el producto.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <AppNavbar 
        title="Inventario" 
        onOpenDrawer={() => setDrawerOpen(true)} 
        onLogout={() => { localStorage.clear(); location.href = "/login"; }} 
      />
      <AppDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <main className="flex-1 mx-auto max-w-7xl w-full px-4 py-8">
        
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Productos</h1>
            <p className="text-sm text-slate-500">Gestiona el stock de repuestos e insumos.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar..."
                className="w-full sm:w-72 rounded-lg border border-slate-300 px-3 py-2 pl-9 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <svg className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            
            <PrimaryButton title="Agregar producto" onClick={openAdd}>
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              <span>Nuevo Producto</span>
            </PrimaryButton>
          </div>
        </div>

        {/* Tabla */}
        <div className="mt-4 overflow-hidden rounded-2xl border bg-white shadow-sm">
          <div className="hidden md:grid grid-cols-12 gap-4 border-b bg-slate-50 px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <div className="col-span-3">Nombre</div>
            <div className="col-span-2">SKU</div>
            <div className="col-span-2">Cantidad</div>
            <div className="col-span-2">Precio</div>
            <div className="col-span-2">Estado</div>
            <div className="col-span-1 text-right">Acciones</div>
          </div>

          {loadingList && <div className="px-6 py-8 text-center text-sm text-slate-500">Cargando inventario...</div>}

          <ul className="divide-y divide-slate-100">
            {filtered.map((p) => (
              <li key={p.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 px-6 py-4 hover:bg-slate-50 transition-colors group">
                <div className="md:col-span-3">
                  <div className="font-medium text-slate-900">{p.name}</div>
                  <div className="text-xs text-slate-500">
                    {p.category && <span className="mr-2">Cat: {p.category}</span>}
                    {p.location && <span>Ubic: {p.location}</span>}
                  </div>
                </div>
                <div className="md:col-span-2 text-slate-600 font-mono text-xs flex items-center">{p.sku}</div>
                <div className="md:col-span-2 text-slate-700 flex items-center">
                  <span className={`font-medium ${p.quantity === 0 ? 'text-red-600' : ''}`}>{p.quantity}</span>
                </div>
                <div className="md:col-span-2 text-slate-700 flex items-center">${p.price.toLocaleString('es-CL', { maximumFractionDigits: 0 })}</div>
                <div className="md:col-span-2 flex items-center">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    p.status === "Activo" ? "bg-emerald-100 text-emerald-700"
                    : p.status === "Sin stock" ? "bg-rose-100 text-rose-700"
                    : "bg-slate-100 text-slate-600"
                  }`}>
                    {p.status}
                  </span>
                </div>
                
                {/* Botones de acción SIEMPRE visibles */}
                <div className="md:col-span-1 flex items-center justify-end gap-1">
                  {/* Editar (Icono Lápiz) */}
                  <IconButton title="Editar" onClick={() => openEdit(p.id)}>
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </IconButton>
                  
                  {/* Eliminar (Icono Basura) */}
                  <IconButton title="Eliminar" onClick={() => openDeleteModal(p)} className="text-red-400 hover:bg-red-50 hover:text-red-600">
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </IconButton>
                </div>

              </li>
            ))}
            {!loadingList && filtered.length === 0 && (
              <li className="px-6 py-8 text-center text-sm text-slate-500">No se encontraron productos.</li>
            )}
          </ul>
        </div>
      </main>

      <AppFooter />

      {/* Modal Crear/Editar */}
      <Modal
        open={modalOpen}
        title={editing ? "Editar Producto" : "Nuevo Producto"}
        onClose={() => setModalOpen(false)}
        onSubmit={saveForm}
        submitText={saving ? "Guardando..." : "Guardar"}
      >
        {errMsg && <div className="mb-3 rounded bg-red-100 text-red-700 px-3 py-2 text-sm">{errMsg}</div>}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Nombre</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">SKU</label>
              <input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Cantidad</label>
              <input type="number" min="0" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Precio</label>
              <input type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Estado</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value }) } className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                <option>Activo</option>
                <option>Inactivo</option>
                <option>Sin stock</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Categoría</label>
              <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Ubicación</label>
              <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
        </div>
      </Modal>
      
      {/* Modal Confirmar Eliminación */}
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
                    ¿Eliminar Producto?
                  </Dialog.Title>
                  
                  <div className="mt-2">
                    <p className="text-sm text-slate-500">
                      Estás a punto de eliminar <strong>{itemToDelete?.name}</strong>.
                      <br/>
                      Esta acción eliminará el producto del inventario permanentemente.
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