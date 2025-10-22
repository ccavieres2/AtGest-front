import logo from "../../assets/logo_.webp";

export default function AppNavbar({
  title = "Dashboard",
  onOpenDrawer,
  onLogout,
  onAlerts,
}) {
  return (
    <header className="sticky top-0 z-40 bg-white/70 backdrop-blur border-b">
      <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
        {/* Izquierda: logo + breadcrumb simple */}
        <div className="flex items-center gap-3">
          <img src={logo} alt="Atgest" className="h-7 w-7 rounded-md object-contain" />
          <span className="font-bold">Atgest</span>
          <span className="hidden sm:inline text-slate-400">/</span>
          <span className="hidden sm:inline text-slate-500">{title}</span>
        </div>

        {/* Derecha: acciones + botón de menú */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            title="Alertas"
            onClick={onAlerts}
            className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-slate-50"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22a2 2 0 0 0 2-2H10a2 2 0 0 0 2 2z" />
              <path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9z" />
            </svg>
            <span>Alertas</span>
          </button>

          <button
            type="button"
            title="Salir"
            onClick={onLogout}
            className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-slate-50"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 17l5-5-5-5" />
              <path d="M21 12H9" />
              <path d="M12 19H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h7" />
            </svg>
            <span>Salir</span>
          </button>

          <button
            className="rounded-lg p-2 hover:bg-slate-100"
            onClick={onOpenDrawer}
            title="Abrir menú"
            aria-label="Abrir menú"
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
