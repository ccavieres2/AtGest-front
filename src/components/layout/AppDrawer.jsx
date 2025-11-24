// src/components/layout/AppDrawer.jsx
import { useNavigate } from "react-router-dom";

export default function AppDrawer({ open, onClose }) {
  const navigate = useNavigate();
  const role = localStorage.getItem("role"); // 👈 Leemos el rol aquí mismo

  // Definimos los menús base (para todos)
  const menuItems = [
    { 
      label: "Dashboard", 
      path: "/dashboard",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><path d="M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/><path d="m9 14 2 2 4-4"/></svg>
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
      label: "Externalización", 
      path: "/external",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><path d="m15 3 6 6m0-6v6h-6"/></svg>
      )
    },
  ];

  // 👇 Lógica condicional centralizada
  if (role === 'owner') {
    menuItems.push({
      label: "Mi Equipo",
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

      {/* Panel lateral */}
      <aside
        className={`fixed inset-y-0 right-0 z-50 w-72 bg-white border-l shadow-lg transform transition-transform duration-200 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!open}
      >
        <div className="flex items-center gap-2 p-4 border-b bg-slate-50">
          <div className="font-bold text-slate-700">Menú</div>
          <button 
            className="ml-auto rounded-lg p-2 hover:bg-slate-200 transition-colors" 
            onClick={onClose} 
            title="Cerrar menú"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 text-slate-600" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <nav className="p-3 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => {
                navigate(item.path);
                onClose(); // Cerrar drawer al navegar
              }}
              className="w-full text-left flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
            >
              {item.icon && <span className="text-slate-400 group-hover:text-indigo-500">{item.icon}</span>}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>
    </>
  );
}