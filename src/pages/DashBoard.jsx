import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppNavbar from "../components/layout/AppNavbar";
import AppDrawer from "../components/layout/AppDrawer";
import AppFooter from "../components/layout/AppFooter";

export default function DashBoard() {
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleLogout = () => {
    localStorage.clear();
    // Usamos location.href para asegurar una recarga limpia,
    // pero navigate("/login") también es válido si prefieres SPA puro.
    location.href = "/login";
  };

  const handleAlerts = () => {
    alert("Aquí irían tus alertas 😉");
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* --- NAVBAR --- */}
      <AppNavbar
        title="Panel principal"
        onOpenDrawer={() => setDrawerOpen(true)}
        onLogout={handleLogout}
        onAlerts={handleAlerts}
      />

      {/* --- DRAWER (MENÚ LATERAL) --- */}
      <AppDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />

      {/* --- CONTENIDO PRINCIPAL --- */}
      <main className="flex-1 mx-auto max-w-7xl w-full px-4 py-6">
        {/* Aquí es donde comenzarás tu nuevo desarrollo */}
        <div className="text-center py-20 text-slate-500">
          <h2 className="text-xl font-semibold">Espacio listo para tu nuevo proceso</h2>
          <p>Comienza a agregar tus componentes aquí.</p>
        </div>
      </main>

      {/* --- FOOTER --- */}
      <AppFooter />
    </div>
  );
}