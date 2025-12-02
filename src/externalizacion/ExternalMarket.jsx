// src/externalizacion/ExternalMarket.jsx
import { useState, useEffect, Fragment } from "react";
import { useNavigate, useSearchParams } from "react-router-dom"; 
import { Dialog, Transition } from "@headlessui/react";
import { apiGet, apiDelete } from "../lib/api";
import { PATHS } from "../routes/path";
import AppNavbar from "../components/layout/AppNavbar";
import AppDrawer from "../components/layout/AppDrawer";
import AppFooter from "../components/layout/AppFooter";

export default function ExternalMarket() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams(); 
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Estados para borrar
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // Lógica de Modos y Roles
  const isSelectMode = searchParams.get("selectMode") === "true";
  const returnUrl = searchParams.get("returnUrl") || "/evaluations";
  
  // 👇 OBTENEMOS ROL Y ID DEL USUARIO ACTUAL
  const userRole = localStorage.getItem("role"); 
  const currentUserId = Number(localStorage.getItem("userId")); 
  const isOwnerRole = userRole === 'owner'; 

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    setLoading(true);
    try {
      // 👇 NUEVA INTEGRACIÓN: 
      // Enviamos el parámetro 'exclude_self' si estamos en modo selección.
      // El backend usará get_data_owner para excluir al "jefe" real.
      const queryParam = isSelectMode ? "?exclude_self=true" : "";
      
      const data = await apiGet(`/external/${queryParam}`);
      setServices(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // 👇 FILTRO SIMPLIFICADO:
  // Ya no filtramos por ID aquí porque el backend ya nos entrega la lista limpia.
  const filtered = services.filter((s) => {
    return (
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.provider_name.toLowerCase().includes(search.toLowerCase())
    );
  });

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      await apiDelete(`/external/${itemToDelete.id}/`);
      setServices((prev) => prev.filter((s) => s.id !== itemToDelete.id));
      setIsDeleteOpen(false);
    } catch (e) {
      alert("Error al eliminar (quizás no tienes permiso)");
    }
  };

  const handleSelectService = (service) => {
    sessionStorage.setItem("pendingExternalService", JSON.stringify(service));
    navigate(decodeURIComponent(returnUrl));
  };

  // ... Funciones de colores ...
  const getCategoryColor = (cat) => {
    const map = {
      mechanic: "bg-blue-50 text-blue-700 border-blue-100",
      lathe: "bg-orange-50 text-orange-700 border-orange-100",
      paint: "bg-pink-50 text-pink-700 border-pink-100",
      electric: "bg-yellow-50 text-yellow-700 border-yellow-100",
      other: "bg-slate-50 text-slate-700 border-slate-100",
    };
    return map[cat] || map.other;
  };

  const getCategoryName = (cat) => {
    const map = {
      mechanic: "Mecánica",
      lathe: "Tornería",
      paint: "Pintura",
      electric: "Electricidad",
      other: "Otro",
    };
    return map[cat] || cat;
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <AppNavbar
        title={isSelectMode ? "Seleccionar Servicio" : "Mercado Externo"}
        onOpenDrawer={() => setDrawerOpen(true)}
        onLogout={() => { localStorage.clear(); location.href = "/login"; }}
      />
      <AppDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <main className="flex-1 mx-auto max-w-7xl w-full px-4 py-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              {isSelectMode ? "Contratar Servicio Externo" : "Servicios Externos"}
            </h1>
            <p className="text-slate-500 mt-1">
              {isSelectMode 
                ? "Elige un proveedor externo para agregarlo a la evaluación." 
                : "Mercado de proveedores y servicios."}
            </p>
          </div>
          
          <div className="flex gap-3">
            {isSelectMode && (
              <button
                onClick={() => navigate(decodeURIComponent(returnUrl))}
                className="border border-slate-300 text-slate-700 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-slate-100 transition-all"
              >
                Cancelar
              </button>
            )}

            <input
              type="text"
              placeholder="Buscar servicio..."
              className="border border-slate-300 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-64"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            
            {!isSelectMode && isOwnerRole && (
              <button
                onClick={() => navigate(PATHS.externalnew)}
                className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 shadow-md transition-all flex items-center gap-2"
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" /></svg>
                Publicar
              </button>
            )}
          </div>
        </div>

        {/* Grid de Tarjetas */}
        {loading ? (
          <div className="text-center py-10 text-slate-500">Cargando servicios...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10 text-slate-500 bg-white rounded-2xl border border-dashed border-slate-300">
            {isSelectMode 
              ? "No se encontraron servicios externos disponibles para contratar." 
              : "No hay servicios publicados."}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((service) => {
              const isMyService = service.owner === currentUserId;

              return (
                <div 
                  key={service.id} 
                  className={`bg-white rounded-2xl border transition-all overflow-hidden flex flex-col ${isSelectMode ? 'cursor-pointer hover:ring-2 hover:ring-indigo-500 hover:border-indigo-500 shadow-md' : 'border-slate-200 shadow-sm hover:shadow-md'}`}
                  onClick={isSelectMode ? () => handleSelectService(service) : undefined}
                >
                  <div className="p-5 flex-1">
                    <div className="flex justify-between items-start mb-3">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md border ${getCategoryColor(service.category)}`}>
                        {getCategoryName(service.category)}
                      </span>
                      <span className="text-lg font-bold text-slate-900">
                        ${Number(service.cost).toLocaleString("es-CL")}
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-bold text-slate-800 leading-snug mb-1">{service.name}</h3>
                    <p className="text-sm text-slate-500 font-medium mb-3 flex items-center gap-1">
                      <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-slate-400"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
                      {service.provider_name}
                    </p>
                    
                    <p className="text-sm text-slate-600 line-clamp-3">{service.description || "Sin descripción detallada."}</p>
                  </div>

                  <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-between items-center">
                    <div className="text-xs text-slate-500">
                      {service.phone ? <span className="flex items-center gap-1">📞 {service.phone}</span> : "Sin teléfono"}
                    </div>
                    
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      {isSelectMode ? (
                        <button 
                          onClick={() => handleSelectService(service)}
                          className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm hover:bg-emerald-700 transition-colors"
                        >
                          CONTRATAR
                        </button>
                      ) : (
                        // Solo mostrar editar/eliminar si ES MI SERVICIO
                        isMyService && (
                          <>
                            <button 
                              onClick={() => navigate(`/external/${service.id}`)} 
                              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                              title="Editar"
                            >
                              <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" /><path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" /></svg>
                            </button>
                            <button 
                              onClick={() => { setItemToDelete(service); setIsDeleteOpen(true); }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="Eliminar"
                            >
                              <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" /></svg>
                            </button>
                          </>
                        )
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
      <AppFooter />
      {/* Modal de Eliminación */}
      <Transition appear show={isDeleteOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsDeleteOpen(false)}>
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Dialog.Panel className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
                <Dialog.Title className="text-lg font-bold text-slate-900">¿Eliminar Servicio?</Dialog.Title>
                <p className="text-sm text-slate-500 mt-2">Esta acción no se puede deshacer.</p>
                <div className="mt-6 flex justify-end gap-3">
                  <button onClick={() => setIsDeleteOpen(false)} className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 text-sm font-medium">Cancelar</button>
                  <button onClick={confirmDelete} className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 text-sm font-medium">Eliminar</button>
                </div>
              </Dialog.Panel>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}