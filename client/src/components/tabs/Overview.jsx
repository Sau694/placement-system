export default function Overview({ data, loading }) {
  if (loading || !data) {
    return <p className="text-muted text-sm">Loading analytics…</p>;
  }

  const cards = [
    { label: "Total Students", value: data.totalStudents },
    { label: "Active Job Drives", value: data.activeDrives },
    { label: "Placed Count", value: data.placedCount },
    { label: "Placement Rate", value: `${data.placementRate}%` },
    { label: "Average Package", value: `${data.averagePackage} LPA` },
  ];

  const branches = Object.entries(data.branchWise || {});

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-[family-name:var(--font-display)] text-2xl text-ink">
          Overview / Analytics
        </h2>
        <p className="text-sm text-muted mt-1">
          Live placement KPIs synced from MongoDB Atlas.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-line bg-panel p-4 shadow-sm"
          >
            <p className="text-[11px] font-semibold tracking-wide uppercase text-muted">
              {card.label}
            </p>
            <p className="mt-2 text-2xl font-bold text-ink">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-line bg-panel p-5 shadow-sm">
        <h3 className="text-sm font-bold text-ink mb-4">Branch-wise Placements</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {branches.map(([branch, stats]) => {
            const rate =
              stats.total > 0 ? Math.round((stats.placed / stats.total) * 100) : 0;
            return (
              <div key={branch} className="rounded-lg border border-line bg-slate-50 p-4">
                <p className="font-semibold text-ink">{branch}</p>
                <p className="text-sm text-muted mt-1">
                  {stats.placed} / {stats.total} placed
                </p>
                <div className="mt-3 h-2 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-full bg-brand-500 rounded-full"
                    style={{ width: `${rate}%` }}
                  />
                </div>
                <p className="mt-2 text-xs font-semibold text-brand-700">{rate}% rate</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
