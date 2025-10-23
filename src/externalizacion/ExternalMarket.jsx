// src/externalization/ExternalMarket.jsx
import { useEffect, useState } from "react";
import { apiGet } from "../lib/api";
import AppNavbar from "../components/layout/AppNavbar";
import AppDrawer from "../components/layout/AppDrawer";
import AppFooter from "../components/layout/AppFooter";
import { useNavigate } from "react-router-dom";

export default function ExternalMarket() {
  const [services, setServices] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    apiGet("/external-services/")
      .then(setServices)
      .catch(() => alert("No se pudieron cargar los servicios externos."));
  }, []);

  function openDetails(service) {
  setSelectedService(service);
  setModalOpen(true);
  }


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

      <AppDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        items={[
          { label: "Órdenes", onClick: () => navigate("/dashboard") },
          { label: "Inventario", onClick: () => navigate("/inventory") },
          { label: "Externalización", onClick: () => navigate("/external") },
          { label: "Publicar servicio", onClick: () => navigate("/externalnew") },

        ]}
      />

      <main className="flex-1 mx-auto max-w-6xl px-4 py-6">
        <h1 className="text-2xl font-bold mb-4">Servicios disponibles</h1>
        <div className="grid md:grid-cols-3 gap-6">
        {services.map((srv) => (
          <div key={srv.id} className="border rounded shadow-sm bg-white overflow-hidden hover:shadow-md transition">
            
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
              <p className="text-sm text-gray-600 line-clamp-2">{srv.description}</p>
              <div className="text-indigo-600 font-bold mt-2">${srv.price}</div>
              <button
                onClick={() => openDetails(srv)}
                className="text-indigo-600 hover:underline text-sm mt-2"
              >
                Ver más
              </button>
            </div>
          </div>
        ))}
        </div>
      </main>

      {modalOpen && selectedService && (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50" onClick={() => setModalOpen(false)} />
        <div className="relative z-10 bg-white rounded-xl shadow-xl p-6 max-w-xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-slate-800">
              {selectedService.title}
            </h3>
            <button onClick={() => setModalOpen(false)} title="Cerrar" className="text-slate-500 hover:text-slate-700">
              ✕
            </button>
          </div>
          <div className="text-sm text-slate-700 space-y-3">
            <p><strong>Descripción:</strong> {selectedService.description}</p>
            <p><strong>Tipo:</strong> {selectedService.service_type}</p>
            <p><strong>Precio:</strong> ${selectedService.price}</p>
            <p><strong>Ubicación:</strong> {selectedService.location || "—"}</p>
            <p><strong>Publicado por:</strong> {selectedService.owner_username || "Anónimo"}</p>
            <p><strong>Fecha de creación:</strong> {selectedService.created_at?.slice(0, 10)}</p>
          </div>
        </div>
      </div>)
      }


      <AppFooter />
    </div>
  );
}
