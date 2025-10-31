// src/externalizacion/ExternalMarket.jsx
import { useEffect, useState } from "react";
import { apiGet } from "../lib/api";
import AppNavbar from "../components/layout/AppNavbar";
import AppDrawer from "../components/layout/AppDrawer";
import AppFooter from "../components/layout/AppFooter";
import { useNavigate } from "react-router-dom";

export default function ExternalMarket() {
  const [services, setServices] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    apiGet("/external-services/")
      .then(setServices)
      .catch(() => alert("No se pudieron cargar los servicios externos."));
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <AppNavbar
        title="Marketplace de Servicios"
        onOpenDrawer={() => setDrawerOpen(true)}
        onLogout={() => {
          localStorage.clear();
          location.href = "/login";
        }}
      />

      {/* 👇 1. Botón "Publicar servicio" ELIMINADO de aquí */}
      <AppDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        items={[
          { label: "Órdenes", onClick: () => navigate("/dashboard") },
          { label: "Inventario", onClick: () => navigate("/inventory") },
          { label: "Externalización", onClick: () => navigate("/external") },
        ]}
      />

      <main className="flex-1 mx-auto max-w-7xl w-full px-4 py-6">
        {/* 👇 2. Encabezado AÑADIDO (similar a Dashboard) */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
          <h1 className="text-2xl font-bold tracking-tight">Servicios disponibles</h1>
          <button
            type="button"
            onClick={() => navigate("/externalnew")}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 text-white px-4 py-2 text-sm font-semibold hover:bg-indigo-700"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            <span>Publicar servicio</span>
          </button>
        </div>

        {/* 3. Grid de servicios (sin cambios) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {services.map((srv) => (
            <div
              key={srv.id}
              className="border rounded shadow-sm bg-white overflow-hidden hover:shadow-md transition"
            >
              {/* Imagen del servicio */}
              {srv.image ? (
                <img
                  src={srv.image}
                  alt={srv.title}
                  className="w-full h-40 object-cover"
                />
              ) : (
                <div className="w-full h-40 bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
                  Sin imagen
                </div>
              )}

              <div className="p-4">
                <h3 className="font-semibold text-lg">{srv.title}</h3>
                <p className="text-sm text-gray-600 line-clamp-2">
                  {srv.description}
                </p>
                <div className="text-indigo-600 font-bold mt-2">${srv.price}</div>
                <button
                  onClick={() => navigate(`/external/${srv.id}`)}
                  className="text-indigo-600 hover:underline text-sm mt-2"
                >
                  Ver detalle
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      <AppFooter />
    </div>
  );
}