import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiPost, apiGet, apiPut } from "../lib/api";
import { PATHS } from "../routes/path";
import AppNavbar from "../components/layout/AppNavbar";
import AppDrawer from "../components/layout/AppDrawer";
import AppFooter from "../components/layout/AppFooter";

export default function OfferForm() {
  const navigate = useNavigate();
  const { id } = useParams(); // Si existe ID, es edición
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  const [form, setForm] = useState({
    name: "",
    provider_name: "",
    description: "",
    cost: "",
    phone: "",
    category: "other"
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) {
      setLoading(true);
      apiGet(`/external/${id}/`)
        .then((data) => setForm(data))
        .catch(() => alert("Error al cargar datos"))
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (id) {
        await apiPut(`/external/${id}/`, form);
      } else {
        await apiPost("/external/", form);
      }
      navigate(PATHS.external);
    } catch (e) {
      console.error(e);
      alert("Error al guardar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <AppNavbar 
        title={id ? "Editar Servicio" : "Nuevo Servicio"} 
        onOpenDrawer={() => setDrawerOpen(true)}
        onLogout={() => { localStorage.clear(); location.href = "/login"; }}
      />
      <AppDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <main className="flex-1 mx-auto max-w-3xl w-full px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-slate-900">{id ? "Editar Publicación" : "Crear Publicación"}</h1>
            <button onClick={() => navigate(PATHS.external)} className="text-sm text-slate-500 hover:text-indigo-600">Cancelar</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Nombre y Categoría */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Título del Servicio</label>
                <input 
                  required
                  value={form.name} 
                  onChange={(e) => setForm({...form, name: e.target.value})} 
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Ej: Rectificado de Culata"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Categoría</label>
                <select 
                  value={form.category} 
                  onChange={(e) => setForm({...form, category: e.target.value})} 
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="mechanic">Mecánica Especializada</option>
                  <option value="lathe">Tornería / Rectificadora</option>
                  <option value="paint">Desabolladura y Pintura</option>
                  <option value="electric">Electricidad</option>
                  <option value="other">Otro</option>
                </select>
              </div>
            </div>

            {/* Proveedor y Teléfono */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Proveedor / Taller</label>
                <input 
                  required
                  value={form.provider_name} 
                  onChange={(e) => setForm({...form, provider_name: e.target.value})} 
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Ej: Taller Don Juan"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono Contacto</label>
                <input 
                  value={form.phone} 
                  onChange={(e) => setForm({...form, phone: e.target.value})} 
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="+56 9 1234 5678"
                />
              </div>
            </div>

            {/* Costo */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Costo Estimado ($)</label>
              <input 
                required
                type="number"
                min="0"
                value={form.cost} 
                onChange={(e) => setForm({...form, cost: e.target.value})} 
                className="w-full border border-slate-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="0"
              />
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Descripción detallada</label>
              <textarea 
                rows="4"
                value={form.description} 
                onChange={(e) => setForm({...form, description: e.target.value})} 
                className="w-full border border-slate-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Detalles del servicio, tiempos de entrega, etc."
              />
            </div>

            <div className="flex justify-end pt-4">
              <button 
                type="submit" 
                disabled={loading}
                className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all disabled:opacity-50"
              >
                {loading ? "Guardando..." : (id ? "Guardar Cambios" : "Publicar Servicio")}
              </button>
            </div>

          </form>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}