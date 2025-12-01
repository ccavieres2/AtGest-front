// src/components/layout/AppNavbar.jsx
import { useState, useEffect, Fragment } from "react"; // 👈 Importar Fragment
import { useNavigate } from "react-router-dom"; // 👈 Importar useNavigate
import { Popover, Transition } from "@headlessui/react"; // 👈 Importar componentes UI
import { apiGet, apiPut } from "../../lib/api"; // 👈 Importar API
import logo from "../../assets/logo_.webp";

export default function AppNavbar({
  title = "Dashboard",
  onOpenDrawer,
  onLogout,
}) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // 1. Cargar notificaciones
  const loadNotifications = async () => {
    try {
      const data = await apiGet("/notifications/"); // Llamada al backend
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.is_read).length);
    } catch (error) {
      console.error("Error loading notifications", error);
    }
  };

  useEffect(() => {
    loadNotifications();
    // Opcional: Polling cada 10 segundos para ver si hay nuevas
    const interval = setInterval(loadNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  // 2. Marcar como leídas al abrir
  const handleOpenAlerts = async () => {
    if (unreadCount > 0) {
      try {
        await apiPut("/notifications/", {}); // Marca todo como leído en backend
        setUnreadCount(0); // Actualiza visualmente
      } catch (e) { console.error(e); }
    }
  };

  const handleNotificationClick = (notif) => {
    if (notif.link) {
      navigate(notif.link);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/70 backdrop-blur border-b">
      <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
        
        {/* ... (Parte Izquierda: Logo) ... */}
        <div className="flex items-center gap-3">
          <img src={logo} alt="Atgest" className="h-7 w-7 rounded-md object-contain" />
          <span className="font-bold">Atgest</span>
          <span className="hidden sm:inline text-slate-400">/</span>
          <span className="hidden sm:inline text-slate-500">{title}</span>
        </div>

        <div className="flex items-center gap-2">
          
          {/* 👇 AQUÍ REEMPLAZAMOS EL BOTÓN DE ALERTAS SIMPLE POR UN POPOVER 👇 */}
          <Popover className="relative">
            {({ open }) => (
              <>
                <Popover.Button
                  onClick={handleOpenAlerts} // Marcar leído al hacer clic
                  className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-slate-50 outline-none ${open ? 'bg-slate-50 ring-2 ring-indigo-500/20' : ''}`}
                >
                  <div className="relative">
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 22a2 2 0 0 0 2-2H10a2 2 0 0 0 2 2z" />
                      <path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9z" />
                    </svg>
                    {/* Punto rojo si hay no leídas */}
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-white"></span>
                    )}
                  </div>
                  <span className="hidden sm:inline">Alertas</span>
                </Popover.Button>

                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-200"
                  enterFrom="opacity-0 translate-y-1"
                  enterTo="opacity-100 translate-y-0"
                  leave="transition ease-in duration-150"
                  leaveFrom="opacity-100 translate-y-0"
                  leaveTo="opacity-0 translate-y-1"
                >
                  <Popover.Panel className="absolute right-0 z-50 mt-2 w-80 transform px-4 sm:px-0 lg:max-w-3xl">
                    <div className="overflow-hidden rounded-xl shadow-lg ring-1 ring-black/5 bg-white">
                      <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                        <span className="font-bold text-slate-700 text-sm">Notificaciones</span>
                        <span className="text-xs text-slate-400">{notifications.length} recientes</span>
                      </div>
                      
                      <div className="max-h-64 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-4 text-center text-sm text-slate-500">Sin novedades.</div>
                        ) : (
                          notifications.map((item) => (
                            <button
                              key={item.id}
                              onClick={() => handleNotificationClick(item)}
                              className={`w-full text-left p-4 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0 ${item.is_read ? 'opacity-60' : 'bg-indigo-50/30'}`}
                            >
                              <p className="text-sm font-medium text-slate-900">{item.message}</p>
                              <p className="text-xs text-slate-400 mt-1">
                                {new Date(item.created_at).toLocaleDateString("es-CL", { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  </Popover.Panel>
                </Transition>
              </>
            )}
          </Popover>
          {/* 👆 FIN DEL POPOVER 👆 */}

          <button
            type="button"
            title="Salir"
            onClick={onLogout}
            className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-slate-50"
          >
            {/* ... icono salir ... */}
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 17l5-5-5-5" />
              <path d="M21 12H9" />
              <path d="M12 19H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h7" />
            </svg>
            <span className="hidden sm:inline">Salir</span>
          </button>

          <button
            className="rounded-lg p-2 hover:bg-slate-100"
            onClick={onOpenDrawer}
            title="Abrir menú"
          >
             {/* ... icono menú ... */}
             <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}