// src/externalizacion/OfferDetail.jsx
import { useEffect, useState, useMemo, Fragment } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiGet, apiDelete, apiPatchMultipart } from "../lib/api"; 
import AppNavbar from "../components/layout/AppNavbar";
import AppDrawer from "../components/layout/AppDrawer";
import AppFooter from "../components/layout/AppFooter";

// --- Imports del Calendario ---
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay, set } from "date-fns";
import esES from "date-fns/locale/es";
// ------------------------------

// --- Imports del Modal de Headless UI ---
import { Dialog, Transition } from '@headlessui/react';
// ----------------------------------------

// 👈 1. Importar el nuevo modal de contratación
import ContratarModal from "./ContratarModal";

// --- Configuración del Calendario ---
const locales = { "es": esES };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { locale: esES }), 
  getDay,
  locales,
});
// ----------------------------------

// --- Barra de herramientas del Calendario (con navegación) ---
const CustomToolbar = ({ label, onNavigate }) => {
  return (
    <div className="rbc-toolbar p-2 flex justify-between items-center">
      <div className="rbc-btn-group">
        <button type="button" className="rbc-button" onClick={() => onNavigate('PREV')}>
          Anterior
        </button>
        <button type="button" className="rbc-button" onClick={() => onNavigate('NEXT')}>
          Siguiente
        </button>
      </div>
      <div className="rbc-toolbar-label text-lg font-semibold">{label}</div>
      <div className="rbc-btn-group"></div>
    </div>
  );
};
// --- ---------------------------------------------------- ---


export default function OfferDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // --- Estados ---
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false); 
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    price: "",
    duration_minutes: "", 
    available: true,
  });
  const [events, setEvents] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const [okMsg, setOkMsg] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false); // Modal para EDITAR horario
  const [currentEvent, setCurrentEvent] = useState(null); 
  
  // 👈 2. Añadir estado para el nuevo modal de CONTRATACIÓN
  const [isContratarModalOpen, setIsContratarModalOpen] = useState(false);
  // --- ------- ---


  // Cargar datos del servicio y del usuario
  useEffect(() => {
    apiGet("/auth/me/")
      .then((user) => setCurrentUser(user))
      .catch(() => console.error("No se pudo cargar el usuario."));

    apiGet(`/external-services/${id}/`)
      .then(data => {
        setService(data);
        setForm({
          title: data.title,
          description: data.description,
          category: data.category || "",
          price: data.price,
          duration_minutes: data.duration_minutes || "",
          available: data.available,
        });
        
        // 👈 3. CAMBIO: Usar el timestamp como ID estable
        // Esto es crucial para que el modal 'ContratarModal' identifique el evento
        setEvents(data.available_hours.map((event) => ({
          id: new Date(event.start).getTime(), // Usamos timestamp como ID
          title: event.title || "Disponible", 
          start: new Date(event.start),
          end: new Date(event.end),
        })));
        // --- ---------------------------------------

        setImagePreview(data.image || null);
      })
      .catch(() => alert("No se pudo cargar el detalle del servicio."))
      .finally(() => setLoading(false));
  }, [id]);

  const isOwner = currentUser && service && currentUser.username === service.owner;

  // --- Handlers de Formulario y Calendario ---
  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  
  const onFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file); 
      setImagePreview(URL.createObjectURL(file)); 
    }
  };
  
  const messages = useMemo(() => ({
    allDay: 'Todo el día', previous: 'Anterior', next: 'Siguiente', today: 'Hoy',
    month: 'Mes', week: 'Semana', day: 'Día', agenda: 'Agenda',
    date: 'Fecha', time: 'Hora', event: 'Evento',
    noEventsInRange: 'No hay horarios disponibles en este rango.',
    showMore: total => `+ Ver ${total} más`,
  }), []);

  // Handlers del Calendario (Modo Edición)
  const handleSelectSlot = ({ start, end }) => {
    // 👈 4. CAMBIO: Usar timestamp como ID
    setCurrentEvent({ id: Date.now(), title: "Horario disponible", start, end });
    setIsModalOpen(true);
  };
  const handleSelectEvent = (event) => {
    setCurrentEvent({ ...event, start: new Date(event.start), end: new Date(event.end) });
    setIsModalOpen(true);
  };
  const handleResizeEvent = ({ event, start, end }) => {
    setEvents((prev) => prev.map((e) => e.id === event.id ? { ...e, start, end } : e));
  };
  const handleDragEvent = ({ event, start, end }) => {
    setEvents((prev) => prev.map((e) => e.id === event.id ? { ...e, start, end } : e));
  };
  
  // Handlers del Modal del Calendario (Modo Edición)
  const pad = (num) => num.toString().padStart(2, '0');
  const toDatetimeLocal = (date) => {
    if (!date || !(date instanceof Date)) return '';
    const YYYY = date.getFullYear();
    const MM = pad(date.getMonth() + 1);
    const DD = pad(date.getDate());
    const hh = pad(date.getHours());
    const mm = pad(date.getMinutes());
    return `${YYYY}-${MM}-${DD}T${hh}:${mm}`;
  };

  const handleModalChange = (e) => {
    const { name, value } = e.target;
    setCurrentEvent((prev) => {
      if (!prev) return null;
      if (name === "title") return { ...prev, title: value };
      if (name === "start" || name === "end") return { ...prev, [name]: new Date(value) };
      return prev;
    });
  };

  const handleSaveEvent = () => {
    if (!currentEvent || !currentEvent.start || !currentEvent.end || !currentEvent.title) {
      alert("Por favor, completa los campos de horario y título.");
      return;
    }
    if (currentEvent.end <= currentEvent.start) {
      alert("La fecha de fin debe ser posterior a la fecha de inicio.");
      return;
    }
    
    // 👈 5. CAMBIO: Asignar nuevo timestamp si es un evento nuevo
    const eventToSave = {
        ...currentEvent,
        id: currentEvent.id || Date.now() 
    };

    setEvents((prev) => {
      const existingIndex = prev.findIndex((e) => e.id === eventToSave.id);
      if (existingIndex > -1) {
        const newEvents = [...prev];
        newEvents[existingIndex] = eventToSave;
        return newEvents;
      } else {
        return [...prev, eventToSave];
      }
    });
    setIsModalOpen(false);
    setCurrentEvent(null);
  };

  const handleDeleteEvent = () => {
    if (currentEvent) {
      setEvents((prev) => prev.filter((e) => e.id !== currentEvent.id));
      setIsModalOpen(false);
      setCurrentEvent(null);
    }
  };
  // --- --------------------------------- ---


  // Lógica para Guardar Cambios (onSubmit)
  async function handleSaveSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setErrMsg("");
    setOkMsg("");

    try {
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("description", form.description);
      formData.append("category", form.category);
      formData.append("price", Number(form.price));
      formData.append("duration_minutes", Number(form.duration_minutes));
      formData.append("available", form.available);

      const availabilityData = events.map(ev => ({
        // El 'id' (timestamp) no es necesario para el backend, solo start y end
        title: ev.title,
        start: ev.start.toISOString(),
        end: ev.end.toISOString(),
      }));
      formData.append("available_hours", JSON.stringify(availabilityData));

      if (imageFile) {
        formData.append("image", imageFile);
      }
      
      const updatedService = await apiPatchMultipart(`/external-services/${id}/`, formData);
      
      setOkMsg("✅ Servicio actualizado correctamente.");
      setService(updatedService); 
      setImagePreview(updatedService.image || null);
      setImageFile(null); 
      setIsEditing(false); // Salimos del modo edición
      
      // 👈 6. CAMBIO: Recargar eventos con los nuevos IDs
      setEvents(updatedService.available_hours.map((event) => ({
          id: new Date(event.start).getTime(),
          title: event.title || "Disponible", 
          start: new Date(event.start),
          end: new Date(event.end),
      })));

      setTimeout(() => {
        setOkMsg("");
      }, 8000); 

    } catch (err) {
      console.error(err);
      let detailedError = "❌ Error al actualizar el servicio. Revisa los datos.";
      try {
        const errorData = JSON.parse(err.message);
        if (errorData.available_hours) {
          detailedError = `Error en los horarios: ${errorData.available_hours[0]}`;
        } else if (errorData.detail) {
          detailedError = `Error: ${errorData.detail}`;
        }
      } catch (parseErr) { /* No era JSON */ }
      setErrMsg(detailedError);
    } finally {
      setSaving(false);
    }
  }
  
  // Lógica de Cancelar Edición
  function handleCancelEdit() {
    setIsEditing(false);
    setErrMsg("");
    setOkMsg("");
    // Revertir formulario y eventos a como estaban en 'service'
    setForm({
      title: service.title,
      description: service.description,
      category: service.category || "",
      price: service.price,
      duration_minutes: service.duration_minutes || "",
      available: service.available,
    });
    setEvents(service.available_hours.map((event) => ({
      id: new Date(event.start).getTime(), 
      title: event.title || "Disponible", 
      start: new Date(event.start),
      end: new Date(event.end),
    })));
    setImageFile(null); 
    setImagePreview(service.image || null);
  }

  // Lógica de Borrar
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


  // --- Renderizado ---
  if (loading) return <div className="text-center p-10">Cargando...</div>;
  if (!service) return <div className="text-center p-10">Servicio no encontrado.</div>;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <AppNavbar
        title={isEditing ? "Editando Servicio" : "Detalle del Servicio"}
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
          { label: "Órdenes", onClick: () => navigate("/dashboard")},
          { label: "Inventario", onClick: () => navigate("/inventory")},
          { label: "Externalización", onClick: () => navigate("/external")},
        ]}
      />

      {/* --- RENDERIZADO CONDICIONAL: MODO VISTA o MODO EDICIÓN --- */}
      {isEditing ? (
        
        // --- MODO EDICIÓN ---
        <main className="flex-1 mx-auto max-w-5xl w-full px-4 py-6">
           {/* Todo este bloque de formulario no cambia */}
           <form onSubmit={handleSaveSubmit} className="space-y-6 bg-white p-6 rounded-2xl shadow">
            
            <h1 className="text-2xl font-bold mb-4">✍️ Editando Servicio</h1>
            
            {okMsg && <div className="p-3 bg-green-100 text-green-800 rounded mb-3">{okMsg}</div>}
            {errMsg && <div className="p-3 bg-red-100 text-red-800 rounded mb-3">{errMsg}</div>}

            {imagePreview && (
              <div 
                className="relative w-full max-w-md mx-auto mb-4 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center"
                style={{ minHeight: '200px', maxHeight: '300px' }}
              >
                <img
                  src={imagePreview}
                  alt={form.title}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            )}
            
            <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Título</label>
                <input name="title" value={form.title} onChange={onChange}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="Ej: Servicio de pintura automotriz" required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Categoría</label>
                <input name="category" value={form.category} onChange={onChange}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="Ej: Mecánica, Electricidad, Pintura"
                />
              </div>
            </fieldset>
            
            <div>
              <label className="block text-sm font-medium mb-1">Descripción</label>
              <textarea name="description" value={form.description} onChange={onChange}
                className="w-full border rounded-lg px-3 py-2 text-sm"
                placeholder="Describe lo que incluye el servicio..." rows={3} required
              />
            </div>

            <fieldset className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Precio</label>
                <input type="number" name="price" value={form.price} onChange={onChange}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="Ej: 25000" min="0" step="0.01" required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Duración (minutos)</label>
                <input type="number" name="duration_minutes" value={form.duration_minutes} onChange={onChange}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="Ej: 90" min="0" required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Cambiar Imagen</label>
                <input type="file" accept="image/*" onChange={onFileChange}
                  className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 
                  file:rounded-full file:border-0 file:bg-indigo-600 file:text-white file:cursor-pointer hover:file:bg-indigo-700"
                />
              </div>
            </fieldset>

            <fieldset>
              <legend className="block text-sm font-medium mb-2">Horarios Disponibles</legend>
              <p className="text-xs text-gray-500 mb-3">
                Usa "Anterior" y "Siguiente". Arrastra en el calendario para crear o mover horarios. Haz clic en un horario para editarlo o borrarlo.
              </p>
              <div className="p-2 border rounded-lg" style={{ height: "600px" }}>
                <Calendar
                  localizer={localizer}
                  locale="es"
                  messages={messages} 
                  events={events}
                  startAccessor="start"
                  endAccessor="end"
                  views={['week', 'day']}
                  defaultView="week" 
                  selectable={true} 
                  onSelectSlot={handleSelectSlot}
                  onSelectEvent={handleSelectEvent}
                  resizable={true} 
                  onEventResize={handleResizeEvent} 
                  draggableAccessor={() => true}
                  onEventDrop={handleDragEvent} 
                  min={set(new Date(0), { hours: 0, minutes: 0 })}
                  max={set(new Date(0), { hours: 23, minutes: 59 })}
                  components={{ toolbar: CustomToolbar }}
                />
              </div>
            </fieldset>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="available"
                  id="available-check"
                  checked={form.available}
                  onChange={(e) => setForm({ ...form, available: e.target.checked })}
                />
                <label htmlFor="available-check" className="text-sm text-gray-700">Disponible para contratación</label>
              </div>

              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={saving}
                  className="bg-gray-200 text-gray-800 rounded-lg px-6 py-2 font-semibold hover:bg-gray-300 disabled:opacity-60"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-green-600 text-white rounded-lg px-6 py-2 font-semibold hover:bg-green-700 disabled:opacity-60"
                >
                  {saving ? "Guardando..." : "Guardar Cambios"}
                </button>
              </div>
            </div>
          </form>
        </main>
      
      ) : (

        // --- MODO VISTA ---
        <main className="flex-1 mx-auto max-w-5xl w-full px-4 py-8">
          
          {okMsg && <div className="p-3 bg-green-100 text-green-800 rounded mb-4">{okMsg}</div>}

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
              <p><strong>Precio:</strong> ${Number(service.price).toLocaleString('es-CL')}</p>
              <p><strong>Categoría:</strong> {service.category || "No especificada"}</p>
              <p><strong>Duración estimada:</strong> {service.duration_minutes} minutos</p>
              <p><strong>Publicado por:</strong> {service.owner || "Anónimo"}</p>
              <p><strong>Disponible:</strong> {service.available ? "Sí" : "No"}</p>
            </div>

            <div>
              <h2 className="text-lg font-semibold mt-4 mb-2">Horarios Disponibles</h2>
              <div className="p-2 border rounded-lg bg-white" style={{ height: "600px" }}>
                <Calendar
                  localizer={localizer}
                  locale="es"
                  messages={messages}
                  events={events}
                  startAccessor="start"
                  endAccessor="end"
                  views={['week', 'day']}
                  defaultView="week"
                  selectable={false}
                  resizable={false}
                  draggableAccessor={() => false}
                  onSelectEvent={event => alert(
                    `Horario: ${event.title}\nDe: ${format(event.start, 'p', { locale: esES })}\nA: ${format(event.end, 'p', { locale: esES })}`
                  )}
                  min={set(new Date(0), { hours: 0, minutes: 0 })}
                  max={set(new Date(0), { hours: 23, minutes: 59 })}
                  components={{ 
                    toolbar: CustomToolbar // Usamos el toolbar con navegación
                  }}
                />
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="mt-6 flex items-center gap-4">
            {isOwner ? (
              <>
                <button
                  className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
                  onClick={() => {
                    setIsEditing(true);
                    setOkMsg(""); 
                    setErrMsg(""); 
                  }}
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
              // 👈 7. CAMBIO EN EL BOTÓN "CONTRATAR"
              <button
                className="mt-6 bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                onClick={() => setIsContratarModalOpen(true)} // Abre el nuevo modal
                disabled={!service.available || events.length === 0} // Deshabilitar si no está disponible o no hay horarios
              >
                {service.available && events.length > 0 ? "Contratar este servicio" : "Servicio no disponible"}
              </button>
            )}
          </div>
        </main>
      )}
      {/* --- ------------------------------------------------------------- --- */}

      <AppFooter />

      {/* --- Modal del Calendario (para el modo EDICIÓN) --- */}
      <Transition appear show={isModalOpen} as={Fragment}>
        {/* ... (Este modal no cambia en absoluto) ... */}
        <Dialog as="div" className="relative z-50" onClose={() => setIsModalOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/25" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900 mb-4"
                  >
                    {events.find(e => e.id === currentEvent?.id) ? 'Editar Horario' : 'Añadir Horario'}
                  </Dialog.Title>
                  <div className="mt-2 space-y-4">
                    <div>
                      <label htmlFor="event-title" className="block text-sm font-medium text-gray-700">Título</label>
                      <input
                        type="text"
                        name="title"
                        id="event-title"
                        value={currentEvent?.title || ''}
                        onChange={handleModalChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        placeholder="Ej: Cita disponible"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="event-start" className="block text-sm font-medium text-gray-700">Inicio</label>
                      <input
                        type="datetime-local"
                        name="start"
                        id="event-start"
                        value={toDatetimeLocal(currentEvent?.start)}
                        onChange={handleModalChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="event-end" className="block text-sm font-medium text-gray-700">Fin</label>
                      <input
                        type="datetime-local"
                        name="end"
                        id="event-end"
                        value={toDatetimeLocal(currentEvent?.end)}
                        onChange={handleModalChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        required
                      />
                    </div>
                  </div>
                  <div className="mt-6 flex justify-between items-center">
                    {events.find(e => e.id === currentEvent?.id) ? (
                      <button
                        type="button"
                        className="inline-flex justify-center rounded-md border border-transparent bg-red-100 px-4 py-2 text-sm font-medium text-red-900 hover:bg-red-200 focus:outline-none"
                        onClick={handleDeleteEvent}
                      >
                        Eliminar
                      </button>
                    ) : (
                      <div />
                    )}
                    <div className="flex gap-3 ml-auto">
                        <button
                            type="button"
                            className="inline-flex justify-center rounded-md border border-transparent bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 focus:outline-none"
                            onClick={() => setIsModalOpen(false)}
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none"
                            onClick={handleSaveEvent}
                        >
                            Guardar
                        </button>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* 👈 8. RENDERIZAR EL NUEVO MODAL DE CONTRATACIÓN */}
      {/* Nos aseguramos de no dar error si el servicio aún no ha cargado */}
      {service && (
        <ContratarModal 
          isOpen={isContratarModalOpen}
          onClose={() => setIsContratarModalOpen(false)}
          service={service}
          events={events} // Le pasamos los eventos (horarios)
        />
      )}

    </div>
  );
}