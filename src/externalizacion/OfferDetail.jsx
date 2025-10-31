// src/externalization/OfferDetail.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
// 1. Importamos apiGet y apiDelete
import { apiGet, apiDelete } from "../lib/api";
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
  
  // Estado para controlar el proceso de borrado
  const [isDeleting, setIsDeleting] = useState(false);

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

  // 2. Función para manejar la eliminación
  const handleDelete = async () => {
    // Pedimos confirmación
    if (!window.confirm("¿Estás seguro de que quieres eliminar esta publicación? Esta acción no se puede deshacer.")) {
      return;
    }

    setIsDeleting(true);
    try {
      // Usamos apiDelete con el ID del servicio
      await apiDelete(`/external-services/${id}/`);
      alert("Servicio eliminado con éxito.");
      // Redirigimos al marketplace
      navigate("/external");
    } catch (err) {
      console.error(err);
      alert("Error al eliminar el servicio. Intenta nuevamente.");
      setIsDeleting(false);
    }
  };

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
        
        {service.image && (
          <div 
            className="relative w-full max-w-3xl mx-auto mb-6 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center"
            style={{ minHeight: '320px', maxHeight: '450px' }}
          >
            <img
              src={service.image}
              alt={service.title}
              className="max-w-full max-h-full object-contain"
            />
          </div>
        )}

        <h1 className="text-3xl font-bold mb-2">{service.title}</h1>
        <p className="text-gray-700 mb-4">{service.description}</p>

        <div className="text-sm space-y-2">
          <p><strong>Precio:</strong> ${Number(service.price).toLocaleString()}</p>
          <p><strong>Categoría:</strong> {service.category || "No especificada"}</p>
          <p><strong>Duración estimada:</strong> {service.duration_minutes} minutos</p>
          <p><strong>Publicado por:</strong> {service.owner || "Anónimo"}</p>
          <p><strong>Fecha de creación:</strong> {service.created_at ? new Date(service.created_at).toLocaleDateString() : 'N/A'}</p>
          <p><strong>Disponible:</strong> {service.available ? "Sí" : "No"}</p>
          
          {/* --- 3. SECCIÓN DE HORARIOS ACTUALIZADA --- */}
          <p className="font-semibold pt-2">Horarios disponibles:</p>
          <ul className="list-disc ml-5 text-sm">
            {(service.available_hours || []).length > 0 ? (
              service.available_hours.map((event, i) => {
                // Intentamos formatear las fechas guardadas (formato calendario)
                try {
                  const start = new Date(event.start);
                  const end = new Date(event.end);
                  // Formato: "Oct 31, 2025: 09:00 - 11:30"
                  const formatted = `${start.toLocaleDateString("es-ES", { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })}: ${start.toLocaleTimeString("es-ES", { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })} - ${end.toLocaleTimeString("es-ES", { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}`;
                  return <li key={i}>{formatted}</li>;
                } catch (e) {
                  // Fallback por si el dato está en el formato antiguo (ej: "09:00-11:00")
                  return <li key={i}>{String(event)}</li>;
                }
              })
            ) : (
              <li className="text-gray-500 list-none">No hay horarios específicos definidos.</li>
            )}
          </ul>
          {/* --- FIN SECCIÓN DE HORARIOS --- */}

        </div>

        {/* 4. Lógica condicional con el botón de Eliminar */}
        <div className="mt-6 flex items-center gap-4">
          {isOwner ? (
            // Si es el dueño, muestra botón de "Editar" y "Eliminar"
            <>
              <button
                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
                onClick={() => alert("Lógica para EDITAR este servicio (en construcción)")}
              >
                Editar mi publicación
              </button>
              
              <button
                className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 disabled:opacity-50"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? "Eliminando..." : "Eliminar publicación"}
              </button>
            </>
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