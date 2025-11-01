// src/externalization/OfferDetail.jsx
import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiGet, apiDelete } from "../lib/api";
import AppNavbar from "../components/layout/AppNavbar";
import AppDrawer from "../components/layout/AppDrawer";
import AppFooter from "../components/layout/AppFooter";

// --- Imports del Calendario ---
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay, set } from "date-fns";
import esES from "date-fns/locale/es";
// ------------------------------

// --- Configuración del Calendario ---
const locales = {
  "es": esES,
};
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { locale: esES }), 
  getDay,
  locales,
});
// ----------------------------------

// --- 1. NUEVO COMPONENTE DE BARRA DE HERRAMIENTAS PERSONALIZADO ---
// Esta barra SOLO muestra el label (la fecha)
const CustomToolbar = ({ label }) => {
  return (
    <div className="rbc-toolbar p-2 flex justify-center items-center">
      {/* El label que muestra la fecha (ej: "Octubre 27 – Noviembre 02") */}
      <div className="rbc-toolbar-label text-lg font-semibold">
        {label}
      </div>
    </div>
  );
};
// --- FIN DEL COMPONENTE PERSONALIZADO ---

export default function OfferDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    apiGet("/auth/me/")
      .then((user) => setCurrentUser(user))
      .catch(() => console.error("No se pudo cargar el usuario."));

    apiGet(`/external-services/${id}/`)
      .then(setService)
      .catch(() => alert("No se pudo cargar el detalle del servicio."))
      .finally(() => setLoading(false));
  }, [id]);

  const isOwner = currentUser && service && currentUser.username === service.owner;

  const handleDelete = async () => {
    if (!window.confirm("¿Estás seguro de que quieres eliminar esta publicación?")) {
      return;
    }
    setIsDeleting(true);
    try {
      await apiDelete(`/external-services/${id}/`);
      alert("Servicio eliminado con éxito.");
      navigate("/external");
    } catch (err) {
      console.error(err);
      alert("Error al eliminar el servicio.");
      setIsDeleting(false);
    }
  };

  // --- LÓGICA DEL CALENDARIO ---
  const calendarEvents = useMemo(() => {
    if (!service?.available_hours) return [];
    
    return service.available_hours.map((event, i) => ({
      id: i, 
      title: event.title || "Disponible", 
      start: new Date(event.start),
      end: new Date(event.end),
    }));
  }, [service?.available_hours]);

  const messages = useMemo(() => ({
    allDay: 'Todo el día', previous: 'Anterior', next: 'Siguiente', today: 'Hoy',
    month: 'Mes', week: 'Semana', day: 'Día', agenda: 'Agenda',
    date: 'Fecha', time: 'Hora', event: 'Evento',
    noEventsInRange: 'No hay horarios disponibles en este rango.',
    showMore: total => `+ Ver ${total} más`,
  }), []);
  // -----------------------------

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

      <main className="flex-1 mx-auto max-w-5xl w-full px-4 py-8">
        
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

        <div className="space-y-4">
          <div className="text-sm grid grid-cols-2 gap-x-4 gap-y-2 max-w-md">
            <p><strong>Precio:</strong> ${Number(service.price).toLocaleString()}</p>
            <p><strong>Categoría:</strong> {service.category || "No especificada"}</p>
            <p><strong>Duración estimada:</strong> {service.duration_minutes} minutos</p>
            <p><strong>Publicado por:</strong> {service.owner || "Anónimo"}</p>
            <p><strong>Disponible:</strong> {service.available ? "Sí" : "No"}</p>
          </div>

          {/* --- CALENDARIO DE DISPONIBILIDAD --- */}
          <div>
            <h2 className="text-lg font-semibold mt-4 mb-2">Horarios Disponibles</h2>
            <div className="p-2 border rounded-lg bg-white" style={{ height: "600px" }}>
              <Calendar
                localizer={localizer}
                locale="es" // 👈 Pone los días de la semana en español
                messages={messages}
                events={calendarEvents}
                startAccessor="start"
                endAccessor="end"
                views={['week', 'day']} // 👈 Quitamos 'month' y 'agenda'
                defaultView="week"
                
                selectable={false}
                resizable={false}
                draggableAccessor={() => false}
                onSelectSlot={() => {}}
                onSelectEvent={event => alert(
                  `Horario: ${event.title}\nDe: ${format(event.start, 'p', { locale: esES })}\nA: ${format(event.end, 'p', { locale: esES })}`
                )}

                min={set(new Date(0), { hours: 0, minutes: 0 })}
                max={set(new Date(0), { hours: 23, minutes: 59 })}
                
                // --- 2. 👈 USA EL COMPONENTE PERSONALIZADO ---
                components={{ toolbar: CustomToolbar }}
                // ---------------------------------------------
              />
            </div>
          </div>
          {/* --- FIN DEL CALENDARIO --- */}
        </div>

        {/* Botones de acción */}
        <div className="mt-6 flex items-center gap-4">
          {isOwner ? (
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