const ALL_NAV = [
  { id: "overview", label: "Overview / Analytics", roles: ["TPO", "COMPANY"] },
  { id: "students", label: "Students Directory", roles: ["TPO", "COMPANY"] },
  { id: "jobs", label: "Jobs & Drives", roles: ["TPO", "COMPANY", "STUDENT"] },
  { id: "applications", label: "Applications Tracker", roles: ["TPO", "COMPANY", "STUDENT"] },
  { id: "records", label: "Add Records", roles: ["TPO", "COMPANY"] },
];
export default function Shell({ user, activeTab, onTabChange, onLogout, children }) {
  const userRole = String(user?.role || "STUDENT").toUpperCase();
  const nav = ALL_NAV.filter((item) => item.roles.includes(userRole));

  return (
    <div className="min-h-full flex bg-canvas">
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-line bg-ink text-white">
        <div className="px-5 py-6 border-b border-white/10">
          <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-brand-100/80">
            Enterprise Portal
          </p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-xl leading-tight">
            Placement Hub
          </h1>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {nav.map((item) => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onTabChange(item.id)}
                className={`w-full text-left rounded-lg px-3 py-2.5 text-sm transition ${
                  active
                    ? "bg-brand-500 text-white shadow-sm"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="p-4 text-xs text-slate-400 border-t border-white/10">
          MERN · MongoDB Atlas · JWT RBAC
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-20 border-b border-line bg-panel/95 backdrop-blur px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="md:hidden">
            <select
              className="rounded-lg border border-line bg-white px-3 py-2 text-sm"
              value={activeTab}
              onChange={(e) => onTabChange(e.target.value)}
            >
              {nav.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
          <div className="hidden md:block">
            <p className="text-sm text-muted">Campus Recruitment Operations</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-semibold text-ink">{user?.name || "User"}</p>
              <p className="text-xs text-muted">{user?.email}</p>
            </div>
            <span className="inline-flex items-center rounded-full bg-brand-50 text-brand-700 px-2.5 py-1 text-xs font-semibold border border-brand-100">
              {user?.role || "USER"}
            </span>
            <button
              type="button"
              onClick={onLogout}
              className="rounded-lg border border-line bg-white px-3 py-2 text-sm font-semibold text-ink hover:bg-slate-50"
            >
              Logout
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
