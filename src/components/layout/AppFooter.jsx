export default function AppFooter() {
  return (
    <footer className="mt-auto border-t bg-white">
      <div className="mx-auto max-w-7xl px-4 py-4 text-xs text-slate-500 flex items-center justify-between">
        <span>© {new Date().getFullYear()} Atgest</span>
        <span className="hidden sm:inline">v0.1 · Demo de panel</span>
      </div>
    </footer>
  );
}
