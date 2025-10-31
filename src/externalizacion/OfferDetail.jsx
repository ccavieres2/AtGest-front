// src/externalization/OfferDetail.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiGet } from "../lib/api";
import AppNavbar from "../components/layout/AppNavbar";
import AppDrawer from "../components/layout/AppDrawer";
import AppFooter from "../components/layout/AppFooter";

export default function OfferDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);

  // Estado para guardar el usuario actual
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // Carga los datos del usuario logueado
    apiGet("/auth/me/")
      .then((user) => setCurrentUser(user))
      .catch(() => console.error("No se pudo cargar el usuario."));

    // Carga el detalle del servicio
    apiGet(`/external-services/${id}/`)
      .then(setService)
      .catch(() => alert("No se pudo cargar el detalle del servicio."))
      .finally(() => setLoading(false));
  }, [id]);

  // Compara el username del usuario logueado con el campo 'owner' del servicio
  const isOwner = currentUser && service && currentUser.username === service.owner;

  if (loading) return <div className="text-center p-10">Cargando...</div>;
  if (!service) return <div className="text-center p-10">Servicio no encontrado.</div>;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <AppNavbar
        title="Detalle del Servicio"
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
          { label: "Marketplace", onClick: () => navigate("/external") },
          { label: "Publicar servicio", onClick: () => navigate("/externalnew") },
        ]}
      />

      <main className="flex-1 mx-auto max-w-4xl w-full px-4 py-8">
        
        {/* --- DIV CONTENEDOR DE IMAGEN (LA SOLUCIÓN HD) --- */}
        {service.image && (
          <div 
            className="relative w-full max-w-3xl mx-auto mb-6 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center"
            // Definimos una altura mínima y máxima para el contenedor
            style={{ minHeight: '320px', maxHeight: '450px' }}
          >
            <img
              src={service.image}
              alt={service.title}
              // max-w-full y max-h-full aseguran que no crezca más que el div
              // object-contain asegura que se vea completa y mantenga la proporción
              className="max-w-full max-h-full object-contain"
            />
          </div>
        )}
        {/* --- FIN DIV CONTENEDOR DE IMAGEN --- */}

        <h1 className="text-3xl font-bold mb-2">{service.title}</h1>
        <p className="text-gray-700 mb-4">{service.description}</p>

        <div className="text-sm space-y-2">
          <p><strong>Precio:</strong> ${service.price}</p>
          <p><strong>Categoría:</strong> {service.category || "No especificada"}</p>
          <p><strong>Duración estimada:</strong> {service.duration_minutes} minutos</p>
          <p><strong>Publicado por:</strong> {service.owner || "Anónimo"}</p>
          <p><strong>Fecha de creación:</strong> {service.created_at?.slice(0, 10)}</p>
          <p><strong>Disponible:</strong> {service.available ? "Sí" : "No"}</p>
          <p><strong>Horarios disponibles:</strong></p>
          <ul className="list-disc ml-5">
            {(service.available_hours || []).map((h, i) => (
              <li key={i}>{h}</li>
            ))}
          </ul>
        </div>

        {/* Lógica condicional para mostrar botones */}
        <div className="mt-6 flex items-center gap-4">
          {isOwner ? (
            // Si es el dueño, muestra botón de "Editar"
            <button
              className="mt-6 bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
              onClick={() => alert("Lógica para EDITAR este servicio (en construcción)")}
            >
              Editar mi publicación
            </button>
          ) : (
            // Si es otro usuario, muestra botón de "Contratar"
            <button
              className="mt-6 bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
              onClick={() => alert("Lógica para contratar servicio")}
            >
              Contratar este servicio
            </button>
          )}
        </div>
      </main>

      <AppFooter />
    </div>
  );
}