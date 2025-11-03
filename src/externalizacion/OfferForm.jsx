import { useState, useMemo, Fragment } from "react"; 
import { useNavigate } from "react-router-dom";
import { apiPostMultipart, apiGet } from "../lib/api";
import AppNavbar from "../components/layout/AppNavbar";
import AppDrawer from "../components/layout/AppDrawer";
import AppFooter from "../components/layout/AppFooter";

// --- Imports del Calendario ---
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay, addHours, set } from "date-fns"; 
import esES from "date-fns/locale/es";
// ------------------------------

// --- Imports del Modal de Headless UI ---
import { Dialog, Transition } from '@headlessui/react';
// ----------------------------------------

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
// Esta barra SÍ tiene navegación (Anterior/Siguiente)
const CustomToolbar = ({ label, onNavigate }) => {
  return (
    <div className="rbc-toolbar p-2 flex justify-between items-center">
      {/* Grupo de botones de navegación */}
      <div className="rbc-btn-group">
        <button 
          type="button" 
          className="rbc-button" // Usamos clases de RBC para que tome el estilo
          onClick={() => onNavigate('PREV')}
        >
          Anterior
        </button>
        <button 
          type="button" 
          className="rbc-button"
          onClick={() => onNavigate('NEXT')}
        >
          Siguiente
        </button>
      </div>

      {/* El label que muestra la fecha (ej: "Octubre 27 – Noviembre 02") */}
      <div className="rbc-toolbar-label text-lg font-semibold">
        {label}
      </div>

      {/* Dejamos este grupo vacío para ocultar los botones de vistas (Mes/Semana/Día) */}
      <div className="rbc-btn-group">
      </div>
    </div>
  );
};
// --- FIN DEL COMPONENTE PERSONALIZADO ---


export default function OfferForm() {
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    price: "",
    duration_minutes: "", 
    available: true,
  });

  const [events, setEvents] = useState([]);
  const [image, setImage] = useState(null);
  const [saving, setSaving] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const [okMsg, setOkMsg] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentEvent, setCurrentEvent] = useState(null); 

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const onFileChange = (e) => setImage(e.target.files[0]);

  // --- LÓGICA DEL CALENDARIO ---

  const handleSelectSlot = ({ start, end }) => {
    setCurrentEvent({ 
      id: Date.now(),
      title: "Horario disponible",
      start, 
      end 
    });
    setIsModalOpen(true);
  };

  const handleSelectEvent = (event) => {
    setCurrentEvent({ ...event, start: new Date(event.start), end: new Date(event.end) });
    setIsModalOpen(true);
  };

  const handleResizeEvent = ({ event, start, end }) => {
    setEvents((prev) => {
      return prev.map((e) =>
        e.id === event.id ? { ...event, start, end } : e
      );
    });
  };

  const handleDragEvent = ({ event, start, end }) => {
    setEvents((prev) => {
      return prev.map((e) =>
        e.id === event.id ? { ...event, start, end } : e
      );
    });
  };

  const messages = useMemo(() => ({
    allDay: 'Todo el día', previous: 'Anterior', next: 'Siguiente', today: 'Hoy',
    month: 'Mes', week: 'Semana', day: 'Día', agenda: 'Agenda',
    date: 'Fecha', time: 'Hora', event: 'Evento',
    noEventsInRange: 'No hay horarios disponibles en este rango.',
    showMore: total => `+ Ver ${total} más`,
  }), []);
  
  // --- FIN LÓGICA CALENDARIO ---

  // --- LÓGICA DEL MODAL ---

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
      if (name === "title") {
        return { ...prev, title: value };
      }
      if (name === "start" || name === "end") {
        return { ...prev, [name]: new Date(value) };
      }
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

    setEvents((prev) => {
      const existingIndex = prev.findIndex((e) => e.id === currentEvent.id);
      if (existingIndex > -1) {
        const newEvents = [...prev];
        newEvents[existingIndex] = currentEvent;
        return newEvents;
      } else {
        return [...prev, currentEvent];
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

  // -------------------------

  async function onSubmit(e) {
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

      if (image) {
        formData.append("image", image);
      }
      
      const availabilityData = events.map(ev => ({
        title: ev.title,
        start: ev.start.toISOString(),
        end: ev.end.toISOString(),
      }));
      
      formData.append("available_hours", JSON.stringify(availabilityData));

      await apiPostMultipart("/external-services/", formData);
      
      setOkMsg("✅ Servicio publicado correctamente.");
      setTimeout(() => navigate("/external"), 1200);

    } catch (err) {
      console.error(err);
      let detailedError = "❌ Error al publicar el servicio. Revisa los datos o tu sesión.";
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

  const drawerItems = [
          { label: "Órdenes", onClick: () => navigate("/dashboard")},
          { label: "Inventario", onClick: () => navigate("/inventory")},
          { label: "Externalización", onClick: () => navigate("/external")},
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <AppNavbar
        title="Publicar servicio"
        onOpenDrawer={() => setDrawerOpen(true)}
        onLogout={() => {
          localStorage.clear();
          location.href = "/login";
        }}
      />

      <AppDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} items={drawerItems} />

      <main className="flex-1 mx-auto max-w-5xl w-full px-4 py-6">
        <h1 className="text-2xl font-bold mb-4">🛠️ Publicar nuevo servicio</h1>

        {okMsg && <div className="p-3 bg-green-100 text-green-800 rounded mb-3">{okMsg}</div>}
        {errMsg && <div className="p-3 bg-red-100 text-red-800 rounded mb-3">{errMsg}</div>}

        <form onSubmit={onSubmit} className="space-y-6 bg-white p-6 rounded-2xl shadow">
          
          {/* ... (campos del formulario: title, category, description, price, etc. No cambian) ... */}
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
              <label className="block text-sm font-medium mb-1">Imagen del servicio</label>
              <input type="file" accept="image/*" onChange={onFileChange}
                className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 
                file:rounded-full file:border-0 file:bg-indigo-600 file:text-white file:cursor-pointer hover:file:bg-indigo-700"
              />
            </div>
          </fieldset>

          {/* --- ZONA DEL CALENDARIO --- */}
          <fieldset>
            <legend className="block text-sm font-medium mb-2">Horarios Disponibles</legend>
            <p className="text-xs text-gray-500 mb-3">
              Usa "Anterior" y "Siguiente" para cambiar de semana. Arrastra en el calendario para crear un horario.
            </p>
            <div className="p-2 border rounded-lg" style={{ height: "600px" }}>
              <Calendar
                localizer={localizer}
                locale="es" // 👈 Pone los días de la semana en español
                messages={messages} 
                events={events}
                startAccessor="start"
                endAccessor="end"
                views={['week', 'day']} // 👈 Quitamos 'month' y 'agenda' para simplificar
                defaultView="week" 
                selectable={true} 
                onSelectSlot={handleSelectSlot}
                onSelectEvent={handleSelectEvent}
                
                resizable={true} 
                onEventResize={handleResizeEvent} 
                
                draggableAccessor={event => true}
                onEventDrop={handleDragEvent} 
                
                min={set(new Date(0), { hours: 0, minutes: 0 })}
                max={set(new Date(0), { hours: 23, minutes: 59 })}

                // --- 2. 👈 USA EL COMPONENTE PERSONALIZADO ---
                components={{ toolbar: CustomToolbar }}
                // ---------------------------------------------
              />
            </div>
          </fieldset>
          {/* --- FIN CALENDARIO --- */}


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

            <button
              type="submit"
              disabled={saving}
              className="bg-indigo-600 text-white rounded-lg px-6 py-2 font-semibold hover:bg-indigo-700 disabled:opacity-60"
            >
              {saving ? "Publicando..." : "Publicar servicio"}
            </button>
          </div>
        </form>
      </main>

      <AppFooter />

      {/* --- EL MODAL DE EVENTO --- */}
      <Transition appear show={isModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsModalOpen(false)}>
          {/* ... (el código del modal no cambia) ... */}
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-40" />
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
                      <label htmlFor="event-title" className="block text-sm font-medium text-gray-700">Título del horario</label>
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
                        className="inline-flex justify-center rounded-md border border-transparent bg-red-100 px-4 py-2 text-sm font-medium text-red-900 hover:bg-red-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
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
                            className="inline-flex justify-center rounded-md border border-transparent bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
                            onClick={() => setIsModalOpen(false)}
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
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
      {/* --- FIN MODAL --- */}

    </div>
  );
}