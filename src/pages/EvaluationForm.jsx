// src/pages/EvaluationForm.jsx
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiGet, apiPost, apiPut } from "../lib/api";
import AppNavbar from "../components/layout/AppNavbar";
import AppDrawer from "../components/layout/AppDrawer";
import AppFooter from "../components/layout/AppFooter";

export default function EvaluationForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  // Datos maestros
  const [clients, setClients] = useState([]);
  const [vehicles, setVehicles] = useState([]); 
  
  // Estado para guardar IDs de vehículos ocupados (con evaluación activa)
  const [busyVehicleIds, setBusyVehicleIds] = useState(new Set());

  // Formulario
  const [selectedClient, setSelectedClient] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [notes, setNotes] = useState("");
  
  // Checklist
  const [items, setItems] = useState([
    { description: "", price: 0, is_approved: true }
  ]);

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(!!id);

  // 1. Cargar Datos Iniciales (Clientes y Evaluaciones para calcular ocupados)
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [clientsData, evalsData] = await Promise.all([
          apiGet("/clients/"),
          apiGet("/evaluations/")
        ]);
        setClients(clientsData);

        // Lógica para identificar vehículos ocupados
        const busyIds = evalsData
          .filter(ev => {
            // Si estamos editando, la evaluación actual NO cuenta como ocupada para sí misma
            if (id && ev.id === Number(id)) return false;
            // Consideramos ocupados todos los que no estén rechazados/cancelados
            return ev.status !== 'rejected'; 
          })
          .map(ev => ev.vehicle); // Extraemos los IDs de vehículos
        
        setBusyVehicleIds(new Set(busyIds));

      } catch (error) {
        console.error("Error cargando datos iniciales", error);
      }
    };
    loadInitialData();
  }, [id]);

  // 2. Cargar datos específicos si estamos EDITANDO
  useEffect(() => {
    if (id) {
      setLoadingData(true);
      apiGet(`/evaluations/${id}/`)
        .then(async (data) => {
          setSelectedClient(data.client);
          setNotes(data.notes);
          setItems(data.items || []);
          
          // Cargar vehículos del cliente
          if (data.client) {
            const clientData = await apiGet(`/clients/${data.client}/`);
            setVehicles(clientData.vehicles || []);
            setSelectedVehicle(data.vehicle); 
          }
        })
        .catch(() => {
          alert("Error al cargar la evaluación.");
          navigate("/evaluations");
        })
        .finally(() => setLoadingData(false));
    }
  }, [id, navigate]);

  // 3. Manejo cambio de cliente
  const handleClientChange = (clientId) => {
    setSelectedClient(clientId);
    setSelectedVehicle(""); 
    setVehicles([]);
    
    if (clientId) {
      // Buscamos los vehículos de este cliente (ya los tenemos en 'clients', pero aseguramos con fetch o filtro local)
      const clientFound = clients.find(c => c.id === Number(clientId));
      if (clientFound && clientFound.vehicles) {
        setVehicles(clientFound.vehicles);
      } else {
        // Fallback por si acaso
        apiGet(`/clients/${clientId}/`).then(data => setVehicles(data.vehicles || []));
      }
    }
  };

  // --- LÓGICA DE FILTRADO DE CLIENTES ---
  // Solo mostramos clientes que tengan AL MENOS UN vehículo disponible
  const availableClients = clients.filter(client => {
    // Si no tiene vehículos, no lo mostramos
    if (!client.vehicles || client.vehicles.length === 0) return false;

    // Verificamos si tiene al menos un vehículo que NO esté en la lista de ocupados
    const hasFreeVehicle = client.vehicles.some(v => !busyVehicleIds.has(v.id));
    
    return hasFreeVehicle;
  });

  // --- Checklist Logic ---
  const handleAddItem = () => {
    setItems([...items, { description: "", price: 0, is_approved: true }]);
  };
  const handleRemoveItem = (index) => setItems(items.filter((_, i) => i !== index));
  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const totalBudget = items.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
  const totalApproved = items
    .filter(i => i.is_approved)
    .reduce((sum, item) => sum + (Number(item.price) || 0), 0);

  // Guardar
  const handleSubmit = async () => {
    if (!selectedClient || !selectedVehicle) return alert("Selecciona cliente y vehículo");
    setLoading(true);
    try {
      let evalId = id;
      const payload = {
        client: selectedClient,
        vehicle: selectedVehicle,
        notes: notes,
        status: 'draft'
      };

      if (id) {
        await apiPut(`/evaluations/${id}/`, payload);
      } else {
        const res = await apiPost("/evaluations/", payload);
        evalId = res.id;
      }

      await apiPost(`/evaluations/${evalId}/update_items/`, {
        items: items.filter(i => i.description.trim() !== "")
      });

      alert(id ? "Evaluación actualizada." : "Evaluación creada.");
      navigate("/evaluations"); 
    } catch (e) {
      console.error(e);
      let msg = "Error al guardar.";
      try {
        const errJson = JSON.parse(e.message);
        if (errJson.vehicle) msg = errJson.vehicle[0];
      } catch {}
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) return <div className="min-h-screen flex items-center justify-center text-slate-500">Cargando datos...</div>;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <AppNavbar title={id ? "Editar Evaluación" : "Nueva Evaluación"} onOpenDrawer={() => setDrawerOpen(true)} />
      <AppDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <main className="flex-1 mx-auto max-w-5xl w-full px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-900">{id ? `Editando Evaluación #${id}` : "Crear Diagnóstico"}</h1>
          <button onClick={() => navigate("/evaluations")} className="text-sm text-slate-500 hover:text-indigo-600 font-medium">
            Cancelar
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          
          {/* SECCIÓN 1: DATOS */}
          <div className="p-6 border-b border-slate-100 bg-slate-50/30">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-4">1. Datos del Vehículo</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Cliente</label>
                <select 
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={selectedClient}
                  onChange={(e) => handleClientChange(e.target.value)}
                >
                  <option value="">-- Seleccionar Cliente --</option>
                  {/* Usamos la lista FILTRADA (availableClients) */}
                  {availableClients.map(c => (
                    <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>
                  ))}
                </select>
                {availableClients.length === 0 && clients.length > 0 && (
                  <p className="text-xs text-amber-600 mt-1">
                    *Todos tus clientes actuales ya tienen evaluaciones activas o no tienen vehículos.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Vehículo</label>
                <select 
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-slate-100"
                  value={selectedVehicle}
                  onChange={(e) => setSelectedVehicle(e.target.value)}
                  disabled={!selectedClient}
                >
                  <option value="">-- Seleccionar Vehículo --</option>
                  
                  {/* Filtramos también la lista de vehículos */}
                  {vehicles
                    .filter(v => {
                      // Mostrar si es el seleccionado actualmente
                      if (v.id === selectedVehicle) return true;
                      // Ocultar si está ocupado
                      if (busyVehicleIds.has(v.id)) return false;
                      return true;
                    })
                    .map(v => (
                      <option key={v.id} value={v.id}>
                        {v.brand} {v.model} ({v.plate})
                      </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: CHECKLIST (Igual que antes) */}
          <div className="p-6">
            <div className="flex justify-between items-end mb-4">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">2. Lista de Diagnóstico</h2>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="flex items-center bg-slate-100 px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <div className="w-8 text-center">#</div>
                <div className="w-10 text-center">OK</div>
                <div className="flex-1 pl-4">Descripción</div>
                <div className="w-32 text-right pr-4">Costo</div>
                <div className="w-8"></div>
              </div>

              <div className="divide-y divide-slate-100 bg-white">
                {items.map((item, index) => (
                  <div key={index} className="flex items-center px-4 py-3 hover:bg-slate-50 transition-colors group">
                    <div className="w-8 text-center text-slate-400 font-mono text-sm">{index + 1}</div>
                    <div className="w-10 flex justify-center">
                      <input 
                        type="checkbox"
                        checked={item.is_approved}
                        onChange={(e) => handleItemChange(index, 'is_approved', e.target.checked)}
                        className="h-5 w-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 cursor-pointer"
                      />
                    </div>
                    <div className="flex-1 pl-4">
                      <input 
                        type="text" 
                        placeholder="Escribe el hallazgo..."
                        className="w-full bg-transparent border-none p-0 text-sm focus:ring-0 placeholder:text-slate-400 text-slate-700"
                        value={item.description}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                      />
                    </div>
                    <div className="w-32 pl-2">
                      <input
                        type="number"
                        className="block w-full rounded-md border-0 py-1.5 pl-5 pr-3 text-right text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                        placeholder="0"
                        value={item.price}
                        onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                      />
                    </div>
                    <div className="w-8 flex justify-end">
                      <button onClick={() => handleRemoveItem(index)} className="text-slate-400 hover:text-red-500 transition-colors">
                        <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button 
                onClick={handleAddItem}
                className="w-full py-3 bg-slate-50 hover:bg-slate-100 text-indigo-600 text-sm font-semibold border-t border-slate-200 transition-colors flex items-center justify-center gap-2"
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                Agregar otro ítem
              </button>
            </div>

            {/* Totales */}
            <div className="mt-6 flex justify-end">
              <div className="bg-slate-50 rounded-xl p-5 w-full max-w-xs border border-slate-100">
                <div className="flex justify-between text-sm text-slate-500 mb-2">
                  <span>Subtotal (Total):</span>
                  <span>${totalBudget.toLocaleString('es-CL')}</span>
                </div>
                <div className="border-t border-slate-200 my-2"></div>
                <div className="flex justify-between text-lg font-bold text-slate-900">
                  <span>Total Aprobado:</span>
                  <span className="text-emerald-600">${totalApproved.toLocaleString('es-CL')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* SECCIÓN 3: GUARDAR */}
          <div className="p-6 border-t border-slate-100 bg-slate-50/30">
            <label className="block text-sm font-medium text-slate-700 mb-2">Observaciones Generales</label>
            <textarea 
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm h-24 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas adicionales..."
            />

            <div className="mt-6 flex justify-end gap-3">
              <button 
                onClick={handleSubmit} 
                disabled={loading}
                className="px-6 py-2.5 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-50 shadow-sm shadow-indigo-200 transition-all"
              >
                {loading ? "Guardando..." : (id ? "Actualizar Evaluación" : "Guardar Evaluación")}
              </button>
            </div>
          </div>

        </div>
      </main>
      <AppFooter />
    </div>
  );
}