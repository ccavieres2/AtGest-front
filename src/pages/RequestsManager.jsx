// src/pages/RequestsManager.jsx
import { useState, useEffect } from "react";
import { apiGet, apiPost } from "../lib/api";
import AppNavbar from "../components/layout/AppNavbar";
import AppDrawer from "../components/layout/AppDrawer";
import AppFooter from "../components/layout/AppFooter";
import ChatWindow from "../externalizacion/ChatWindow"; // 👈 Importamos el componente de chat

export default function RequestsManager() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  // Estados de datos
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estado de la interfaz
  const [activeTab, setActiveTab] = useState("received"); // 'received' (Proveedor) | 'sent' (Cliente)
  
  // Estado para controlar el chat modal
  const [selectedChatRequest, setSelectedChatRequest] = useState(null); 

  // Obtenemos el ID del usuario actual para filtrar qué mostrar
  const currentUserId = Number(localStorage.getItem("userId"));

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const data = await apiGet("/requests/");
      setRequests(data);
    } catch (error) {
      console.error("Error cargando solicitudes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = async (id, status) => {
    const actionMap = {
      accepted: "aceptar",
      rejected: "rechazar",
      completed: "completar"
    };
    
    if (!confirm(`¿Estás seguro de ${actionMap[status]} esta solicitud?`)) return;

    try {
      await apiPost(`/requests/${id}/respond/`, { status });
      loadRequests(); // Recargamos para ver el cambio de estado
    } catch (error) {
      console.error(error);
      alert("Error al actualizar el estado de la solicitud.");
    }
  };

  // Filtramos las solicitudes según la pestaña activa
  const displayedRequests = requests.filter(req => {
    if (activeTab === "received") {
      // Soy el PROVEEDOR (Carlos): Me muestran lo que me pidieron a mí
      return req.provider === currentUserId;
    } 
    if (activeTab === "sent") {
      // Soy el SOLICITANTE (Iván): Muestro lo que yo pedí a otros
      return req.requester === currentUserId;
    }
    return false;
  });

  const getStatusBadge = (status) => {
    const styles = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      accepted: "bg-emerald-100 text-emerald-800 border-emerald-200",
      rejected: "bg-red-100 text-red-800 border-red-200",
      completed: "bg-blue-100 text-blue-800 border-blue-200",
    };
    const labels = {
      pending: "Pendiente",
      accepted: "En Proceso",
      rejected: "Rechazada",
      completed: "Finalizada"
    };
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${styles[status] || "bg-gray-100"}`}>
        {labels[status] || status}
      </span>
    );
  };

  // Items para el menú lateral
  const drawerItems = [
    { label: "Volver al Dashboard", path: "/dashboard" },
    { label: "Mercado Externo", path: "/external" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <AppNavbar 
        title="Solicitudes y Mensajes" 
        onOpenDrawer={() => setDrawerOpen(true)}
        onLogout={() => { localStorage.clear(); location.href = "/login"; }}
      />
      <AppDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} items={drawerItems} />

      <main className="flex-1 mx-auto max-w-5xl w-full px-4 py-8">
        
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Solicitudes de Servicios</h1>
          <p className="text-slate-500">Gestiona los trabajos externalizados entre talleres.</p>
        </div>

        {/* PESTAÑAS */}
        <div className="flex border-b border-slate-200 mb-6">
          <button
            onClick={() => setActiveTab("received")}
            className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'received' 
                ? 'border-indigo-600 text-indigo-600' 
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            📥 Recibidas (Soy Proveedor)
          </button>
          <button
            onClick={() => setActiveTab("sent")}
            className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'sent' 
                ? 'border-indigo-600 text-indigo-600' 
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            📤 Enviadas (Soy Cliente)
          </button>
        </div>

        {/* LISTADO */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center text-slate-500 py-12">Cargando solicitudes...</div>
          ) : displayedRequests.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300">
              <p className="text-slate-500">No hay solicitudes en esta sección.</p>
            </div>
          ) : (
            displayedRequests.map(req => (
              <div key={req.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row md:items-center justify-between gap-4">
                
                {/* Información de la solicitud */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-bold text-slate-800 text-lg">{req.service_name}</h3>
                    {getStatusBadge(req.status)}
                  </div>
                  
                  <div className="text-sm text-slate-600 space-y-1">
                    <p>
                      {activeTab === 'received' 
                        ? <>Solicitado por: <strong className="text-indigo-600">{req.requester_name}</strong></> 
                        : <>Proveedor: <strong className="text-indigo-600">{req.provider_name}</strong></>
                      }
                    </p>
                    <p className="text-xs text-slate-400">
                      Fecha: {new Date(req.created_at).toLocaleDateString("es-CL", { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                      {req.related_order_id && <span className="ml-2">• Ref. OT #{req.related_order_id}</span>}
                    </p>
                  </div>
                </div>

                {/* Botonera de Acciones */}
                <div className="flex flex-wrap items-center gap-2">
                  
                  {/* CHAT: Visible si está aceptada o completada */}
                  {(req.status === 'accepted' || req.status === 'completed') && (
                    <button
                      onClick={() => setSelectedChatRequest(req)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-50 text-indigo-700 text-sm font-semibold hover:bg-indigo-100 border border-indigo-100 transition-colors"
                    >
                      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      Mensajes
                    </button>
                  )}

                  {/* Acciones para el PROVEEDOR (Carlos) */}
                  {activeTab === 'received' && (
                    <>
                      {req.status === 'pending' && (
                        <>
                          <button 
                            onClick={() => handleResponse(req.id, 'rejected')}
                            className="px-4 py-2 rounded-lg border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 transition-colors"
                          >
                            Rechazar
                          </button>
                          <button 
                            onClick={() => handleResponse(req.id, 'accepted')}
                            className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 shadow-sm transition-colors"
                          >
                            Aceptar Trabajo
                          </button>
                        </>
                      )}

                      {req.status === 'accepted' && (
                        <button 
                          onClick={() => handleResponse(req.id, 'completed')}
                          className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 shadow-sm transition-colors"
                        >
                          Marcar Terminado
                        </button>
                      )}
                    </>
                  )}
                </div>

              </div>
            ))
          )}
        </div>

      </main>
      
      <AppFooter />

      {/* RENDERIZADO DEL CHAT MODAL */}
      {selectedChatRequest && (
        <ChatWindow 
          request={selectedChatRequest} 
          onClose={() => setSelectedChatRequest(null)} 
        />
      )}

    </div>
  );
}