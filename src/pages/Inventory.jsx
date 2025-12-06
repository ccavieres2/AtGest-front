// src/pages/Inventory.jsx
import { useEffect, useMemo, useState, Fragment } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, Transition, Tab } from "@headlessui/react";
import { apiGet, apiPost, apiPut, apiDelete } from "../lib/api";
import AppNavbar from "../components/layout/AppNavbar";
import AppDrawer from "../components/layout/AppDrawer";
import AppFooter from "../components/layout/AppFooter";

// --- Componentes UI Pequeños ---

function Badge({ children, color = "gray" }) {
  const colors = {
    green: "bg-emerald-50 text-emerald-700 border-emerald-100",
    red: "bg-rose-50 text-rose-700 border-rose-100",
    gray: "bg-slate-50 text-slate-600 border-slate-100",
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    orange: "bg-orange-50 text-orange-700 border-orange-100"
  };
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${colors[color] || colors.gray}`}>
      {children}
    </span>
  );
}

// Modal Genérico
function Modal({ open, title, onClose, children, footer }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl transform transition-all overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="text-lg font-bold text-slate-800">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full hover:bg-slate-100">
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          {children}
        </div>
        {footer && (
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Inventory() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all"); // all, low, out

  // Estados para Row Expandida (Historial Lotes)
  const [expandedRowId, setExpandedRowId] = useState(null);
  const [batchesCache, setBatchesCache] = useState({}); 
  const [loadingBatches, setLoadingBatches] = useState(false);

  // Modales
  const [productModal, setProductModal] = useState({ open: false, mode: 'create', data: null });
  const [stockModal, setStockModal] = useState({ open: false, product: null });
  const [batchEditModal, setBatchEditModal] = useState({ open: false, batch: null });

  const [saving, setSaving] = useState(false);

  // Forms
  const [prodForm, setProdForm] = useState({ name: "", sku: "", category: "", location: "", sale_price: 0, description: "" });
  const [entryForm, setEntryForm] = useState({ initial_quantity: 1, unit_cost: 0, entry_date: "", expiration_date: "" });
  const [batchForm, setBatchForm] = useState({ 
    product: null,
    initial_quantity: 0, 
    current_quantity: 0, 
    unit_cost: 0, 
    entry_date: "", 
    expiration_date: "" 
  });

  useEffect(() => { loadProducts(); }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await apiGet("/products/");
      setProducts(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const reloadBatches = async (productId) => {
    setLoadingBatches(true);
    try {
      const data = await apiGet(`/products/${productId}/batches/`);
      setBatchesCache(prev => ({ ...prev, [productId]: data }));
    } catch (e) { console.error(e); }
    finally { setLoadingBatches(false); }
  };

  const toggleRow = async (productId) => {
    if (expandedRowId === productId) {
      setExpandedRowId(null);
      return;
    }
    setExpandedRowId(productId);
    
    if (!batchesCache[productId]) {
      reloadBatches(productId);
    }
  };

  const filteredProducts = useMemo(() => {
    let res = products;
    if (search) {
      const s = search.toLowerCase();
      res = res.filter(p => p.name.toLowerCase().includes(s) || p.sku.toLowerCase().includes(s));
    }
    if (filterType === "low") res = res.filter(p => p.stock_actual <= 5 && p.stock_actual > 0);
    if (filterType === "out") res = res.filter(p => p.stock_actual === 0);
    
    return res;
  }, [products, search, filterType]);

  // --- 1. GESTIÓN DE PRODUCTOS ---
  const openCreateProduct = () => {
    setProdForm({ name: "", sku: "", category: "", location: "", sale_price: 0, description: "" });
    setProductModal({ open: true, mode: 'create', data: null });
  };

  const openEditProduct = (p) => {
    setProdForm({ 
      name: p.name, sku: p.sku, category: p.category || "", 
      location: p.location || "", sale_price: p.sale_price, description: p.description || "" 
    });
    setProductModal({ open: true, mode: 'edit', data: p });
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (productModal.mode === 'edit') {
        await apiPut(`/products/${productModal.data.id}/`, prodForm);
      } else {
        await apiPost("/products/", prodForm);
      }
      setProductModal({ open: false, mode: 'create', data: null });
      loadProducts();
    } catch (e) { alert("Error al guardar"); }
    finally { setSaving(false); }
  };

  // --- 2. ENTRADAS (NUEVO LOTE) ---
  const openAddStock = (e, p) => {
    e.stopPropagation(); 
    setEntryForm({ 
      initial_quantity: 1, unit_cost: 0, 
      entry_date: new Date().toISOString().split('T')[0], expiration_date: "" 
    });
    setStockModal({ open: true, product: p });
  };

  const handleSaveStock = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiPost("/batches/", {
        product: stockModal.product.id,
        initial_quantity: entryForm.initial_quantity,
        unit_cost: entryForm.unit_cost,
        entry_date: entryForm.entry_date,
        expiration_date: entryForm.expiration_date || null
      });
      alert("Entrada registrada correctamente");
      setStockModal({ open: false, product: null });
      loadProducts(); 
      if (expandedRowId === stockModal.product.id) {
        reloadBatches(stockModal.product.id);
      } else {
        setBatchesCache(prev => {
            const copy = {...prev};
            delete copy[stockModal.product.id];
            return copy;
        });
      }
    } catch (e) { alert("Error al agregar stock"); }
    finally { setSaving(false); }
  };

  // --- 3. GESTIÓN DE LOTES (EDITAR/ELIMINAR) ---
  const openEditBatch = (batch) => {
    setBatchForm({
      product: batch.product, // 👈 SOLUCIÓN DEL ERROR 400: ENVIAMOS EL ID DEL PRODUCTO
      initial_quantity: batch.initial_quantity,
      current_quantity: batch.current_quantity,
      unit_cost: batch.unit_cost,
      entry_date: batch.entry_date,
      expiration_date: batch.expiration_date || ""
    });
    setBatchEditModal({ open: true, batch });
  };

  const handleUpdateBatch = async () => {
    if (Number(batchForm.current_quantity) > Number(batchForm.initial_quantity)) {
      if(!confirm("Advertencia: El stock actual es mayor que la cantidad inicial ingresada. ¿Deseas continuar igual?")) return;
    }

    setSaving(true);
    try {
      await apiPut(`/batches/${batchEditModal.batch.id}/`, batchForm);
      setBatchEditModal({ open: false, batch: null });
      alert("Lote actualizado.");
      loadProducts(); 
      reloadBatches(expandedRowId); 
    } catch (e) {
      alert("Error al actualizar lote.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBatch = async (batchId) => {
    if (!confirm("¿Eliminar este lote por completo? Se restará el stock inmediatamente.")) return;
    try {
      await apiDelete(`/batches/${batchId}/`);
      loadProducts(); 
      reloadBatches(expandedRowId); 
    } catch (e) {
      alert("Error al eliminar lote.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      <AppNavbar 
        title="Inventario" 
        onOpenDrawer={() => setDrawerOpen(true)} 
        onLogout={() => { localStorage.clear(); location.href = "/login"; }} 
      />
      <AppDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <main className="flex-1 mx-auto max-w-6xl w-full px-4 py-8">
        
        {/* Cabecera */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Inventario</h1>
            <p className="text-slate-500 mt-1">Gestiona tu catálogo y recepciona mercadería.</p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <input
                type="text"
                placeholder="Buscar producto..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border-none bg-white shadow-sm ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-500 text-sm"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <svg className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" /></svg>
            </div>
            <button onClick={openCreateProduct} className="bg-slate-900 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-800 transition-all shadow-md flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M12 4v16m8-8H4"/></svg>
              <span className="hidden sm:inline">Nuevo Producto</span>
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex gap-1 bg-slate-200/50 p-1 rounded-xl w-fit mb-6">
          {[{ id: 'all', label: 'Todos' }, { id: 'low', label: 'Stock Bajo' }, { id: 'out', label: 'Sin Stock' }].map(tab => (
            <button key={tab.id} onClick={() => setFilterType(tab.id)} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${filterType === tab.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tabla */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="hidden md:grid grid-cols-12 gap-4 border-b bg-slate-50 px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <div className="col-span-4">Producto</div>
            <div className="col-span-2">SKU</div>
            <div className="col-span-2 text-center">Stock Total</div>
            <div className="col-span-2 text-right">Precio Venta</div>
            <div className="col-span-2 text-right">Acciones</div>
          </div>

          {loading ? <div className="p-12 text-center text-slate-400">Cargando catálogo...</div> : null}

          <div className="divide-y divide-slate-100">
            {filteredProducts.map((product) => {
              const isExpanded = expandedRowId === product.id;
              const hasStock = product.stock_actual > 0;
              
              return (
                <div key={product.id} className="group transition-colors bg-white hover:bg-slate-50/50">
                  <div onClick={() => toggleRow(product.id)} className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center gap-4 cursor-pointer">
                    <div className="flex-1 flex items-start gap-4">
                      <div className={`mt-1 h-10 w-10 shrink-0 rounded-lg flex items-center justify-center text-lg font-bold border ${hasStock ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                        {product.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-base">{product.name}</h3>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="font-mono text-xs text-slate-500 bg-slate-100 px-1.5 rounded">{product.sku}</span>
                          {product.category && <span className="text-xs text-slate-500">• {product.category}</span>}
                          {product.location && <Badge color="gray">📍 {product.location}</Badge>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 justify-between sm:justify-end w-full sm:w-auto pl-14 sm:pl-0">
                      <div className="text-right">
                        <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-0.5">Stock Total</p>
                        <p className={`text-lg font-bold ${!hasStock ? 'text-red-500' : product.stock_actual <= 5 ? 'text-orange-500' : 'text-emerald-600'}`}>
                          {product.stock_actual} <span className="text-sm font-normal text-slate-400">un.</span>
                        </p>
                      </div>
                      
                      <div className="text-right w-24">
                        <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-0.5">Venta</p>
                        <p className="font-medium text-slate-700">${Number(product.sale_price).toLocaleString("es-CL")}</p>
                      </div>

                      <button onClick={(e) => openAddStock(e, product)} className="p-2 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all shadow-sm border border-indigo-100 hover:border-indigo-600" title="Recepcionar Mercadería (Entrada)">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
                      </button>

                      <div className={`text-slate-300 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                        <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                      </div>
                    </div>
                  </div>

                  <div className={`overflow-hidden transition-all duration-300 bg-slate-50 border-y border-slate-100 ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="px-4 py-4 sm:px-16 sm:py-6">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Desglose de Lotes (FIFO)</h4>
                        <button onClick={() => openEditProduct(product)} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium hover:underline">Editar Ficha Producto</button>
                      </div>

                      {loadingBatches ? <div className="text-xs text-slate-400">Cargando lotes...</div> : !batchesCache[product.id] || batchesCache[product.id].length === 0 ? (
                        <p className="text-sm text-slate-500 italic">No hay lotes con stock activo.</p>
                      ) : (
                        <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white shadow-sm">
                          <table className="w-full text-sm text-left">
                            <thead className="bg-slate-100 text-slate-500 font-semibold text-xs uppercase">
                              <tr>
                                <th className="px-4 py-2">ID</th>
                                <th className="px-4 py-2">Ingreso</th>
                                <th className="px-4 py-2">Vencimiento</th>
                                <th className="px-4 py-2 text-right">Inicial</th>
                                <th className="px-4 py-2 text-right">Actual</th>
                                <th className="px-4 py-2 text-right">Acciones</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-600">
                              {batchesCache[product.id].map(batch => (
                                <tr key={batch.id}>
                                  <td className="px-4 py-2 font-mono text-xs">#{batch.id}</td>
                                  <td className="px-4 py-2">{new Date(batch.entry_date).toLocaleDateString()}</td>
                                  <td className="px-4 py-2">
                                    {batch.expiration_date ? (
                                      <span className={`px-1.5 py-0.5 rounded text-xs ${new Date(batch.expiration_date) < new Date() ? 'bg-red-100 text-red-700 font-bold' : ''}`}>
                                        {new Date(batch.expiration_date).toLocaleDateString()}
                                      </span>
                                    ) : "—"}
                                  </td>
                                  <td className="px-4 py-2 text-right text-slate-400">{batch.initial_quantity}</td>
                                  <td className="px-4 py-2 text-right font-bold text-indigo-600">{batch.current_quantity}</td>
                                  <td className="px-4 py-2 text-right">
                                    <div className="flex justify-end gap-2">
                                      <button onClick={() => openEditBatch(batch)} className="p-1 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors" title="Corregir Lote">
                                        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                      </button>
                                      <button onClick={() => handleDeleteBatch(batch.id)} className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Eliminar Lote">
                                        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      <AppFooter />

      {/* MODAL 1: Crear/Editar Ficha Producto */}
      <Modal
        open={productModal.open}
        title={productModal.mode === 'create' ? "Nuevo Producto" : "Editar Ficha"}
        onClose={() => setProductModal({ ...productModal, open: false })}
        footer={
          <>
            <button onClick={() => setProductModal({ ...productModal, open: false })} className="text-sm font-semibold text-slate-500 hover:text-slate-800">Cancelar</button>
            <button onClick={handleSaveProduct} disabled={saving} className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-800 disabled:opacity-50">
              {saving ? "Guardando..." : "Guardar Ficha"}
            </button>
          </>
        }
      >
        <form className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre</label>
            <input required className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500" value={prodForm.name} onChange={e => setProdForm({...prodForm, name: e.target.value})}/>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">SKU</label>
              <input className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none font-mono" value={prodForm.sku} onChange={e => setProdForm({...prodForm, sku: e.target.value})}/>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Precio Venta</label>
              <input type="number" min="0" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none" value={prodForm.sale_price} onChange={e => setProdForm({...prodForm, sale_price: e.target.value})}/>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Categoría</label>
              <input className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none" value={prodForm.category} onChange={e => setProdForm({...prodForm, category: e.target.value})}/>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Ubicación</label>
              <input className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none" value={prodForm.location} onChange={e => setProdForm({...prodForm, location: e.target.value})}/>
            </div>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: Recepcionar Stock */}
      <Modal
        open={stockModal.open}
        title="Recepcionar Stock (Entrada)"
        onClose={() => setStockModal({ ...stockModal, open: false })}
        footer={
          <>
            <button onClick={() => setStockModal({ ...stockModal, open: false })} className="text-sm font-semibold text-slate-500 hover:text-slate-800">Cancelar</button>
            <button onClick={handleSaveStock} disabled={saving} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50">
              {saving ? "Procesando..." : "Confirmar Entrada"}
            </button>
          </>
        }
      >
        <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100 mb-4 text-xs text-indigo-800 font-medium">Agregando a: {stockModal.product?.name}</div>
        <form className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cantidad</label>
              <input type="number" min="1" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none" value={entryForm.initial_quantity} onChange={e => setEntryForm({...entryForm, initial_quantity: e.target.value})}/>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Costo Unitario</label>
              <input type="number" min="0" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none" value={entryForm.unit_cost} onChange={e => setEntryForm({...entryForm, unit_cost: e.target.value})}/>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Ingreso</label>
              <input type="date" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none" value={entryForm.entry_date} onChange={e => setEntryForm({...entryForm, entry_date: e.target.value})}/>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Vencimiento</label>
              <input type="date" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none" value={entryForm.expiration_date} onChange={e => setEntryForm({...entryForm, expiration_date: e.target.value})}/>
            </div>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: EDITAR LOTE (Corrección Completa) */}
      <Modal
        open={batchEditModal.open}
        title="Corregir Lote"
        onClose={() => setBatchEditModal({ ...batchEditModal, open: false })}
        footer={
          <>
            <button onClick={() => setBatchEditModal({ ...batchEditModal, open: false })} className="text-sm font-semibold text-slate-500 hover:text-slate-800">Cancelar</button>
            <button onClick={handleUpdateBatch} disabled={saving} className="bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-amber-700 disabled:opacity-50">
              {saving ? "Guardando..." : "Guardar Corrección"}
            </button>
          </>
        }
      >
        <div className="bg-amber-50 p-3 rounded-lg border border-amber-100 mb-4 text-xs text-amber-800">
          <strong>Atención:</strong> Úsalo para corregir errores de ingreso (ej: digitaste mal la cantidad inicial).
        </div>
        <form className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cantidad Inicial</label>
              <input type="number" min="1" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-500" value={batchForm.initial_quantity} onChange={e => setBatchForm({...batchForm, initial_quantity: e.target.value})}/>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Stock Actual</label>
              <input type="number" min="0" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-500" value={batchForm.current_quantity} onChange={e => setBatchForm({...batchForm, current_quantity: e.target.value})}/>
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Costo Unitario</label>
            <input type="number" min="0" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-500" value={batchForm.unit_cost} onChange={e => setBatchForm({...batchForm, unit_cost: e.target.value})}/>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Ingreso</label>
              <input type="date" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-500" value={batchForm.entry_date} onChange={e => setBatchForm({...batchForm, entry_date: e.target.value})}/>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Vencimiento</label>
              <input type="date" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-500" value={batchForm.expiration_date} onChange={e => setBatchForm({...batchForm, expiration_date: e.target.value})}/>
            </div>
          </div>
        </form>
      </Modal>

    </div>
  );
}