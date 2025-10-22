// src/components/layout/AppDrawer.jsx
export default function AppDrawer({ open, onClose, items }) {
  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={onClose} />}
      <aside
        className={`fixed inset-y-0 right-0 z-50 w-72 bg-white border-l shadow-lg transform transition-transform duration-200 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!open}
      >
        <div className="flex items-center gap-2 p-4 border-b">
          <div className="font-semibold">Panel</div>
          <button className="ml-auto rounded-lg p-2 hover:bg-slate-100" onClick={onClose} title="Cerrar">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        <nav className="p-3 space-y-1 text-sm">
          {(items || []).map(({ label, onClick }) => (
            <button
              key={label}
              onClick={() => { onClick?.(); onClose(); }}
              className="w-full text-left flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-slate-100"
            >
              <span className="h-2 w-2 rounded-full bg-indigo-500" />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </aside>
    </>
  );
}
