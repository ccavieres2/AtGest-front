// src/pages/RequestsManager.jsx
import { useState, useEffect } from "react";
import { apiGet, apiPost } from "../lib/api";
import AppNavbar from "../components/layout/AppNavbar";
import AppDrawer from "../components/layout/AppDrawer";
import AppFooter from "../components/layout/AppFooter";

export default function RequestsManager() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("received"); // 'received' | 'sent'
  
  // Obtenemos el ID del usuario actual para filtrar en el front visualmente
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
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = async (id, status) => {
    if(!confirm(`¿Estás seguro de marcar como ${status}?`)) return;
    try {
      await apiPost(`/requests/${id}/respond/`, { status });
      loadRequests(); // Recargar lista
    } catch (error) {
      alert("Error al actualizar estado.");
    }
  };

  // Filtrar según pestaña
  const displayedRequests = requests.filter(req => {
    if (activeTab === "received") return req.provider === currentUserId;
    if (activeTab === "sent") return req.requester === currentUserId;
    return false;
  });

  const getStatusBadge = (status) => {
    const map = {
      pending: "bg-yellow-100 text-yellow-800",
      accepted: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      completed: "bg-blue-100 text-blue-800",
    };
    const label = {
      pending: "Pendiente",
      accepted: "Aceptada",
      rejected: "Rechazada",
      completed: "Finalizada"
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-bold ${map[status] || "bg-gray-100"}`}>
        {label[status] || status}
      </span>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <AppNavbar 
        title="Gestión de Solicitudes" 
        onOpenDrawer={() => setDrawerOpen(true)}
        onLogout={() => { localStorage.clear(); location.href = "/login"; }}
      />
      <AppDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <main className="flex-1 mx-auto max-w-5xl w-full px-4 py-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">Solicitudes de Servicios</h1>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 mb-6">
          <button
            onClick={() => setActiveTab("received")}
            className={`px-6 py-3 text-sm font-medium ${activeTab === 'received' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            📥 Solicitudes Recibidas (Soy Proveedor)
          </button>
          <button
            onClick={() => setActiveTab("sent")}
            className={`px-6 py-3 text-sm font-medium ${activeTab === 'sent' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            📤 Solicitudes Enviadas (Soy Cliente)
          </button>
        </div>

        {/* Lista */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center text-slate-500 py-10">Cargando...</div>
          ) : displayedRequests.length === 0 ? (
            <div className="text-center text-slate-500 py-10 bg-white rounded-xl border border-dashed">
              No tienes solicitudes en esta sección.
            </div>
          ) : (
            displayedRequests.map(req => (
              <div key={req.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                
                {/* Info Izquierda */}
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-bold text-slate-800">{req.service_name}</h3>
                    {getStatusBadge(req.status)}
                  </div>
                  <p className="text-sm text-slate-600">
                    {activeTab === 'received' 
                      ? <>Solicitado por: <strong className="text-indigo-600">{req.requester_name}</strong></> 
                      : <>Proveedor: <strong className="text-indigo-600">{req.provider_name}</strong></>
                    }
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {new Date(req.created_at).toLocaleDateString()} • Ref. Orden #{req.related_order_id || "?"}
                  </p>
                </div>

                {/* Acciones (Solo para Recibidas y Pendientes) */}
                {activeTab === 'received' && req.status === 'pending' && (
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleResponse(req.id, 'rejected')}
                      className="px-4 py-2 rounded-lg border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50"
                    >
                      Rechazar
                    </button>
                    <button 
                      onClick={() => handleResponse(req.id, 'accepted')}
                      className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 shadow-sm"
                    >
                      Aceptar Trabajo
                    </button>
                  </div>
                )}

                {/* Acción Completar (Para Recibidas y Aceptadas) */}
                {activeTab === 'received' && req.status === 'accepted' && (
                  <button 
                    onClick={() => handleResponse(req.id, 'completed')}
                    className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 shadow-sm"
                  >
                    Marcar Completado
                  </button>
                )}

              </div>
            ))
          )}
        </div>

      </main>
      <AppFooter />
    </div>
  );
}