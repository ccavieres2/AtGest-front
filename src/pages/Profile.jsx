// src/pages/Profile.jsx
import { useState, useEffect } from "react";
import { apiGet, apiPut } from "../lib/api";
import AppNavbar from "../components/layout/AppNavbar";
import AppDrawer from "../components/layout/AppDrawer";
import AppFooter from "../components/layout/AppFooter";

export default function Profile() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Estado del formulario
  const [form, setForm] = useState({
    username: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: ""
  });

  const [msg, setMsg] = useState({ type: "", text: "" });

  // Cargar datos actuales
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const data = await apiGet("/auth/me/");
      setForm({
        username: data.username,
        email: data.email,
        phone: data.phone || "",
        password: "",
        confirmPassword: ""
      });
    } catch (error) {
      console.error(error);
      setMsg({ type: "error", text: "No se pudieron cargar los datos." });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg({ type: "", text: "" });

    // Validación simple de contraseña
    if (form.password && form.password !== form.confirmPassword) {
      return setMsg({ type: "error", text: "Las contraseñas no coinciden." });
    }

    setSaving(true);
    try {
      // Preparamos payload (solo enviamos password si el usuario escribió algo)
      const payload = {
        username: form.username,
        email: form.email,
        phone: form.phone
      };
      if (form.password) {
        payload.password = form.password;
      }

      await apiPut("/auth/me/", payload);
      
      setMsg({ type: "success", text: "Perfil actualizado correctamente." });
      setForm(prev => ({ ...prev, password: "", confirmPassword: "" })); // Limpiar campos de pass
      
    } catch (error) {
      let errorText = "Error al actualizar perfil.";
      try {
        const parsed = JSON.parse(error.message);
        errorText = parsed.error || parsed.detail || errorText;
      } catch(e) {}
      setMsg({ type: "error", text: errorText });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <AppNavbar 
        title="Mi Perfil" 
        onOpenDrawer={() => setDrawerOpen(true)} 
        onLogout={() => { localStorage.clear(); location.href = "/login"; }} 
      />
      <AppDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <main className="flex-1 mx-auto max-w-xl w-full px-4 py-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">Editar Perfil</h1>

        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200">
          
          {msg.text && (
            <div className={`mb-6 p-4 rounded-lg text-sm font-medium ${
              msg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {msg.text}
            </div>
          )}

          {loading ? (
            <div className="text-center py-10 text-slate-500">Cargando datos...</div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Avatar Placeholder */}
              <div className="flex justify-center mb-6">
                <div className="h-20 w-20 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-2xl font-bold border-4 border-white shadow-sm">
                  {form.username?.charAt(0).toUpperCase()}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre de Usuario</label>
                <input 
                  type="text" 
                  value={form.username} 
                  onChange={e => setForm({...form, username: e.target.value})}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Correo Electrónico</label>
                <input 
                  type="email" 
                  value={form.email} 
                  onChange={e => setForm({...form, email: e.target.value})}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Teléfono</label>
                <input 
                  type="text" 
                  value={form.phone} 
                  onChange={e => setForm({...form, phone: e.target.value})}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="+56 9 ..."
                />
              </div>

              <div className="border-t border-slate-100 my-4 pt-4">
                <h3 className="text-sm font-semibold text-slate-800 mb-3">Cambiar Contraseña</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Nueva Contraseña (Opcional)</label>
                    <input 
                      type="password" 
                      value={form.password} 
                      onChange={e => setForm({...form, password: e.target.value})}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="Dejar en blanco para mantener la actual"
                    />
                  </div>
                  {form.password && (
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Confirmar Nueva Contraseña</label>
                      <input 
                        type="password" 
                        value={form.confirmPassword} 
                        onChange={e => setForm({...form, confirmPassword: e.target.value})}
                        className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:ring-2 outline-none ${
                          form.password !== form.confirmPassword ? 'border-red-300 focus:ring-red-500' : 'border-slate-300 focus:ring-indigo-500'
                        }`}
                        placeholder="Repite la contraseña"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={saving}
                  className="w-full bg-indigo-600 text-white rounded-xl py-3 font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all disabled:opacity-70 flex justify-center items-center gap-2"
                >
                  {saving ? "Guardando..." : "Guardar Cambios"}
                </button>
              </div>

            </form>
          )}
        </div>
      </main>
      <AppFooter />
    </div>
  );
}