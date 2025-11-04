// src/externalizacion/ContratarModal.jsx
import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition, RadioGroup } from '@headlessui/react';
import { apiGet, apiPost } from '../lib/api';
import { format } from 'date-fns';
import esES from 'date-fns/locale/es';
import { useNavigate } from 'react-router-dom';

export default function ContratarModal({ isOpen, onClose, service, events }) {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [errMsg, setErrMsg] = useState("");
  const [saving, setSaving] = useState(false);

  // 1. Cargar las órdenes del usuario
  useEffect(() => {
    if (isOpen) {
      setLoadingOrders(true);
      setErrMsg(""); // Limpiar errores anteriores
      apiGet("/orders/")
        .then((data) => {
          // ❗️ Filtramos por los estados que tu modelo define como "previos"
          const pendingOrders = data.filter(order => 
            order.status === 'pending' || order.status === 'awaiting_approval'
          );
          setOrders(pendingOrders);
          if (pendingOrders.length > 0) {
            setSelectedOrder(pendingOrders[0]); // Selecciona la primera por defecto
          }
        })
        .catch(() => setErrMsg("Error al cargar tus órdenes."))
        .finally(() => setLoadingOrders(false));
    }
  }, [isOpen]); // Recargar cada vez que se abre el modal

  // 2. Formatear la fecha del evento para mostrarla
  const formatEvent = (event) => {
    const start = new Date(event.start);
    const end = new Date(event.end);
    // ej: lunes 03 de noviembre (14:00 - 15:00)
    const day = format(start, "eeee dd 'de' MMMM", { locale: esES });
    const startTime = format(start, "HH:mm", { locale: esES });
    const endTime = format(end, "HH:mm", { locale: esES });
    return `${day} (${startTime} - ${endTime})`;
  };

  // 3. Manejar el envío
  const handleHire = async () => {
    if (!selectedEvent) {
      setErrMsg("Debes seleccionar un horario.");
      return;
    }
    if (!selectedOrder) {
      setErrMsg("Debes seleccionar una orden. Si no tienes, crea una en el Dashboard.");
      return;
    }
    
    setSaving(true);
    setErrMsg("");

    try {
      const payload = {
        service_id: service.id,
        // Pasamos los strings ISO. El backend los parseará.
        start_time: selectedEvent.start.toISOString(),
        end_time: selectedEvent.end.toISOString(),
      };

      // Usamos el nuevo endpoint: /orders/:order_id/add-service/
      const updatedOrder = await apiPost(`/orders/${selectedOrder.id}/add-service/`, payload);
      
      // Éxito
      alert("¡Servicio agregado a tu orden correctamente! Serás redirigido al Dashboard.");
      navigate("/dashboard"); // Redirige al dashboard
      handleClose();

    } catch (err) {
      console.error(err);
      let errorMsg = "Error al agregar el servicio. Inténtalo de nuevo.";
      try {
        const errorData = JSON.parse(err.message);
        errorMsg = errorData.error || errorMsg;
      } catch(e) {}
      setErrMsg(errorMsg);
    } finally {
      setSaving(false);
    }
  };
  
  // 4. Resetear estado al cerrar
  const handleClose = () => {
      onClose();
      // Espera que la transición de cierre termine para resetear
      setTimeout(() => {
          setErrMsg("");
          setSelectedEvent(null);
          setSelectedOrder(null);
          setOrders([]);
      }, 300); 
  }
  
  // Helper para mostrar el nombre del estado
  const getStatusLabel = (status) => {
    const labels = {
      pending: "Pendiente",
      awaiting_approval: "Esperando Aprobación"
    };
    return labels[status] || status;
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
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
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                  Contratar Servicio: {service?.title}
                </Dialog.Title>
                
                <div className="mt-4 space-y-4">
                  
                  {/* --- Selector de Horario --- */}
                  <div className="max-h-60 overflow-y-auto rounded-md border p-2">
                    <RadioGroup value={selectedEvent} onChange={setSelectedEvent}>
                      <RadioGroup.Label className="block text-sm font-medium text-gray-700">
                        1. Selecciona un horario disponible
                      </RadioGroup.Label>
                      <div className="mt-2 space-y-2">
                        {events.length > 0 ? events.map((event) => (
                          <RadioGroup.Option
                            key={event.id} // Usamos el ID (timestamp)
                            value={event}
                            className={({ active, checked }) =>
                              `${active ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}
                               ${checked ? 'bg-indigo-600 text-white' : 'bg-white'}
                               relative flex cursor-pointer rounded-lg px-4 py-3 shadow-sm border focus:outline-none`
                            }
                          >
                            {({ checked }) => (
                              <div className="flex w-full items-center justify-between">
                                <div className="flex items-center">
                                  <div className="text-sm">
                                    <RadioGroup.Label as="p" className={`font-medium ${checked ? 'text-white' : 'text-gray-900'}`}>
                                      {event.title}
                                    </RadioGroup.Label>
                                    <RadioGroup.Description as="span" className={`inline ${checked ? 'text-indigo-100' : 'text-gray-500'}`}>
                                      {formatEvent(event)}
                                    </RadioGroup.Description>
                                  </div>
                                </div>
                              </div>
                            )}
                          </RadioGroup.Option>
                        )) : (
                           <p className="text-sm text-gray-500">No hay horarios disponibles para este servicio.</p>
                        )}
                      </div>
                    </RadioGroup>
                  </div>

                  {/* --- Selector de Orden --- */}
                  <div>
                    <label htmlFor="order-select" className="block text-sm font-medium text-gray-700">
                      2. Selecciona la orden donde quieres agregarlo
                    </label>
                    {loadingOrders ? (
                      <p className="text-sm text-gray-500">Cargando órdenes...</p>
                    ) : (
                      <select
                        id="order-select"
                        name="order"
                        className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                        value={selectedOrder ? selectedOrder.id : ""}
                        onChange={(e) => {
                           const order = orders.find(o => o.id.toString() === e.target.value);
                           setSelectedOrder(order);
                        }}
                      >
                        {orders.length > 0 ? (
                           orders.map(order => (
                             <option key={order.id} value={order.id}>
                               Orden #{order.id} ({order.vehicle_model} / {order.client_name}) - [{getStatusLabel(order.status)}]
                             </option>
                           ))
                        ) : (
                           <option value="" disabled>No tienes órdenes activas</option>
                        )}
                      </select>
                    )}
                     <p className="text-xs text-gray-500 mt-1">
                        Si no tienes una orden, ve al <button onClick={() => navigate("/dashboard")} className="font-medium text-indigo-600 hover:underline">Dashboard</button> para crear una.
                    </p>
                  </div>
                  
                  {errMsg && (
                    <div className="p-3 bg-red-100 text-red-800 rounded text-sm">{errMsg}</div>
                  )}

                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-transparent bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                    onClick={handleClose}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                    onClick={handleHire}
                    disabled={!selectedEvent || !selectedOrder || loadingOrders || saving || events.length === 0}
                  >
                    {saving ? "Agregando..." : "Agregar a la Orden"}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}