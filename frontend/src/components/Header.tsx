export default function Header() {
  return (
    <header className="border-b border-slate-200/80 bg-white/75 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 lg:px-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-teal-700">VisionAI Browser</p>
          <h1 className="text-2xl font-semibold text-slate-950">Conversational browser for accessible government forms</h1>
        </div>
        <div className="rounded-full border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-medium text-teal-800 shadow-sm">
          Tamil + English voice support
        </div>
      </div>
    </header>
  );
}
