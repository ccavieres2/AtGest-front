// src/pages/EvaluationForm.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiGet, apiPost } from "../lib/api";
import AppNavbar from "../components/layout/AppNavbar";
import AppDrawer from "../components/layout/AppDrawer";
import AppFooter from "../components/layout/AppFooter";

export default function EvaluationForm() {
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  // Datos maestros
  const [clients, setClients] = useState([]);
  const [vehicles, setVehicles] = useState([]); // Vehículos del cliente seleccionado
  
  // Formulario
  const [selectedClient, setSelectedClient] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [notes, setNotes] = useState("");
  
  // Checklist (Array de objetos)
  const [items, setItems] = useState([
    { description: "", price: 0, is_approved: true }
  ]);

  const [loading, setLoading] = useState(false);

  // 1. Cargar Clientes al inicio
  useEffect(() => {
    apiGet("/clients/").then(setClients).catch(console.error);
  }, []);

  // 2. Cuando cambia el cliente, cargar sus vehículos
  useEffect(() => {
    if (selectedClient) {
      apiGet(`/clients/${selectedClient}/`).then(data => {
        setVehicles(data.vehicles || []);
        setSelectedVehicle(""); // Reset vehículo
      });
    } else {
      setVehicles([]);
    }
  }, [selectedClient]);

  // --- Manejo del Checklist ---
  const handleAddItem = () => {
    setItems([...items, { description: "", price: 0, is_approved: true }]);
  };

  const handleRemoveItem = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  // Cálculo de Totales
  const totalBudget = items.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
  const totalApproved = items
    .filter(i => i.is_approved)
    .reduce((sum, item) => sum + (Number(item.price) || 0), 0);

  // --- Guardar ---
  const handleSubmit = async () => {
    if (!selectedClient || !selectedVehicle) return alert("Selecciona cliente y vehículo");
    
    setLoading(true);
    try {
      // 1. Crear la Evaluación (Cabecera)
      const evalRes = await apiPost("/evaluations/", {
        client: selectedClient,
        vehicle: selectedVehicle,
        notes: notes,
        status: 'draft'
      });

      // 2. Guardar los Items (usando la acción custom que creamos en Django)
      await apiPost(`/evaluations/${evalRes.id}/update_items/`, {
        items: items.filter(i => i.description.trim() !== "") // Solo items con texto
      });

      alert("Evaluación creada correctamente");
      navigate("/evaluations"); 
    } catch (e) {
      console.error(e);
      alert("Error al guardar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <AppNavbar title="Nueva Evaluación" onOpenDrawer={() => setDrawerOpen(true)} />
      <AppDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <main className="flex-1 mx-auto max-w-5xl w-full px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Crear Diagnóstico</h1>
          <button onClick={() => navigate(-1)} className="text-sm text-slate-500 hover:text-indigo-600 font-medium">
            Cancelar
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          
          {/* SECCIÓN 1: DATOS DEL VEHÍCULO */}
          <div className="p-6 border-b border-slate-100 bg-slate-50/30">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-4">1. Datos del Vehículo</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Cliente</label>
                <select 
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={selectedClient}
                  onChange={(e) => setSelectedClient(e.target.value)}
                >
                  <option value="">-- Seleccionar Cliente --</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>
                  ))}
                </select>
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
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.brand} {v.model} ({v.plate})</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: CHECKLIST (DISEÑO TIPO LISTA) */}
          <div className="p-6">
            <div className="flex justify-between items-end mb-4">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">2. Lista de Diagnóstico</h2>
            </div>

            {/* --- INICIO DE LA LISTA --- */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              
              {/* Encabezado de la lista */}
              <div className="flex items-center bg-slate-100 px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <div className="w-8 text-center">#</div>
                <div className="w-10 text-center">OK</div>
                <div className="flex-1 pl-4">Descripción del problema / Repuesto</div>
                <div className="w-32 text-right pr-4">Costo</div>
                <div className="w-8"></div>
              </div>

              {/* Cuerpo de la lista */}
              <div className="divide-y divide-slate-100 bg-white">
                {items.map((item, index) => (
                  <div key={index} className="flex items-center px-4 py-3 hover:bg-slate-50 transition-colors group">
                    
                    {/* Número */}
                    <div className="w-8 text-center text-slate-400 font-mono text-sm">{index + 1}</div>

                    {/* Checkbox */}
                    <div className="w-10 flex justify-center">
                      <input 
                        type="checkbox"
                        checked={item.is_approved}
                        onChange={(e) => handleItemChange(index, 'is_approved', e.target.checked)}
                        className="h-5 w-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 cursor-pointer"
                        title="Marcar si el cliente aprueba este ítem"
                      />
                    </div>
                    
                    {/* Descripción */}
                    <div className="flex-1 pl-4">
                      <input 
                        type="text" 
                        placeholder="Escribe el hallazgo..."
                        className="w-full bg-transparent border-none p-0 text-sm focus:ring-0 placeholder:text-slate-400 text-slate-700"
                        value={item.description}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                      />
                    </div>

                    {/* Precio */}
                    <div className="w-32 pl-2">
                      <div className="relative rounded-md shadow-sm">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2">
                          <span className="text-slate-400 sm:text-xs">$</span>
                        </div>
                        <input
                          type="number"
                          className="block w-full rounded-md border-0 py-1.5 pl-5 pr-3 text-right text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                          placeholder="0"
                          value={item.price}
                          onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Botón Borrar (Solo visible al pasar el mouse o en móvil) */}
                    <div className="w-8 flex justify-end opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleRemoveItem(index)} className="text-slate-400 hover:text-red-500 transition-colors">
                        <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Botón Agregar al final de la lista */}
              <button 
                onClick={handleAddItem}
                className="w-full py-3 bg-slate-50 hover:bg-slate-100 text-indigo-600 text-sm font-semibold border-t border-slate-200 transition-colors flex items-center justify-center gap-2"
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                Agregar otro ítem
              </button>
            </div>
            {/* --- FIN DE LA LISTA --- */}

            {/* Resumen de Totales */}
            <div className="mt-6 flex justify-end">
              <div className="bg-slate-50 rounded-xl p-5 w-full max-w-xs border border-slate-100">
                <div className="flex justify-between text-sm text-slate-500 mb-2">
                  <span>Subtotal (Todos los ítems):</span>
                  <span>${totalBudget.toLocaleString('es-CL')}</span>
                </div>
                <div className="border-t border-slate-200 my-2"></div>
                <div className="flex justify-between text-lg font-bold text-slate-900">
                  <span>Total Aprobado:</span>
                  <span className="text-emerald-600">${totalApproved.toLocaleString('es-CL')}</span>
                </div>
                <p className="text-xs text-slate-400 text-right mt-1">Monto estimado a cobrar</p>
              </div>
            </div>
          </div>

          {/* SECCIÓN 3: NOTAS Y GUARDAR */}
          <div className="p-6 border-t border-slate-100 bg-slate-50/30">
            <label className="block text-sm font-medium text-slate-700 mb-2">Observaciones Generales</label>
            <textarea 
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm h-24 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas adicionales para el cliente o mecánicos..."
            />

            <div className="mt-6 flex justify-end gap-3">
              <button 
                onClick={handleSubmit} 
                disabled={loading}
                className="px-6 py-2.5 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-50 shadow-sm shadow-indigo-200 transition-all"
              >
                {loading ? "Guardando..." : "Guardar Evaluación"}
              </button>
            </div>
          </div>

        </div>
      </main>
      <AppFooter />
    </div>
  );
}