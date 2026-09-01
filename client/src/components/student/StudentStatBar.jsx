export default function StudentStatBar({
  eligibleCount = 0,
  totalDrives = 0,
  appliedCount = 0,
  offersCount = 0,
  profile,
}) {
  const placementStatus = profile?.placementStatus || "Eligible";

  const cards = [
    {
      label: "Eligible Drives",
      value: `${eligibleCount} / ${totalDrives}`,
      subtext: "Matches your CGPA & branch",
      icon: (
        <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      bg: "bg-emerald-50/70 border-emerald-100",
      accent: "text-emerald-700",
    },
    {
      label: "Active Applications",
      value: appliedCount,
      subtext: "Under review / pipeline",
      icon: (
        <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      bg: "bg-blue-50/70 border-blue-100",
      accent: "text-blue-700",
    },
    {
      label: "Offers Received",
      value: offersCount,
      subtext: offersCount > 0 ? "🎉 Offer Extended!" : "Keep applying!",
      icon: (
        <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      ),
      bg: "bg-amber-50/70 border-amber-100",
      accent: "text-amber-700",
    },
    {
      label: "Placement Status",
      value: placementStatus,
      subtext: profile ? `CGPA: ${profile.cgpa} · ${profile.branch}` : "Syncing profile...",
      icon: (
        <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      bg: "bg-purple-50/70 border-purple-100",
      accent: "text-purple-700",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
      {cards.map((c) => (
        <div
          key={c.label}
          className={`rounded-2xl border ${c.bg} p-4 transition-all duration-200 hover:shadow-sm`}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider">
              {c.label}
            </p>
            <div className="p-1.5 rounded-lg bg-white shadow-xs border border-line/40">
              {c.icon}
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between gap-2">
            <p className={`text-2xl font-black ${c.accent} tracking-tight`}>
              {c.value}
            </p>
          </div>
          <p className="mt-1 text-[11px] font-medium text-slate-500 truncate">
            {c.subtext}
          </p>
        </div>
      ))}
    </div>
  );
}
