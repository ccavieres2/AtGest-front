// src/components/layout/AppDrawer.jsx
import { useNavigate } from "react-router-dom";

export default function AppDrawer({ open, onClose }) {
  const navigate = useNavigate();
  const role = localStorage.getItem("role"); 

  // Definimos los menús base
  const menuItems = [
    { 
      label: "Dashboard", 
      path: "/dashboard",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 00-2-2h-2"/><path d="M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/><path d="m9 14 2 2 4-4"/></svg>
      )
    },
    { 
      label: "Clientes", 
      path: "/clients",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
    { 
      label: "Evaluaciones", 
      path: "/evaluations",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
      )
    },
    { 
      label: "Órdenes de Trabajo", 
      path: "/orders",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9 2 2 4-4" />
        </svg>
      )
    },
    { 
      label: "Inventario", 
      path: "/inventory",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0l-2 5H6l-2-5m16 0s-2 5-6 5-6-5-6-5"/></svg>
      )
    },
    { 
      label: "Solicitudes y Mensajes",
      path: "/requests",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"/></svg>
      )
    },
    { 
      label: "Externalización", 
      path: "/external",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><path d="m15 3 6 6m0-6v6h-6"/></svg>
      )
    },
  ];

  // Agregar "Mi Personal" si es dueño
  if (role === 'owner') {
    menuItems.push({
      label: "Mi Personal",
      path: "/team",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
      )
    });
  }

  return (
    <>
      {/* Overlay oscuro para móvil */}
      {open && (
        <div 
          className="fixed inset-0 z-40 bg-black/30 lg:hidden" 
          onClick={onClose} 
        />
      )}

      {/* Panel lateral: flex flex-col para empujar el perfil al fondo */}
      <aside
        className={`fixed inset-y-0 right-0 z-50 w-72 bg-white border-l shadow-lg transform transition-transform duration-200 flex flex-col ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!open}
      >
        {/* Cabecera Modificada para alineación */}
        <div className="flex items-center gap-2 px-4 py-3 border-b bg-slate-50 shrink-0">
          <div className="font-bold text-slate-700">Menú</div>
          <button 
            className="ml-auto rounded-lg p-2 hover:bg-slate-200 transition-colors" 
            onClick={onClose} 
            title="Cerrar menú"
          >
            {/* Icono ajustado a h-6 w-6 */}
            <svg viewBox="0 0 24 24" className="h-6 w-6 text-slate-600" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        {/* Lista de Navegación (flex-1 para ocupar el espacio disponible) */}
        <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => {
                navigate(item.path);
                onClose();
              }}
              className="w-full text-left flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
            >
              {item.icon && <span className="text-slate-400 group-hover:text-indigo-500">{item.icon}</span>}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* SECCIÓN PERFIL (Solo dueños, pegada al fondo) */}
        {role === 'owner' && (
          <div className="p-3 border-t border-slate-100 bg-slate-50/50 shrink-0 mt-auto">
            <button
              onClick={() => {
                navigate("/profile");
                onClose();
              }}
              className="w-full flex items-center gap-3 rounded-xl px-4 py-3 bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all group text-left"
            >
              <div className="h-9 w-9 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm border border-indigo-200">
                ME
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-800 group-hover:text-indigo-700 truncate">Mi Perfil</p>
                <p className="text-xs text-slate-500 truncate">Editar mis datos</p>
              </div>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 ml-auto text-slate-400 group-hover:text-indigo-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>
        )}

      </aside>
    </>
  );
}