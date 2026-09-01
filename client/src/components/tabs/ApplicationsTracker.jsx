import { useEffect, useState } from "react";
import { api, getStoredUser } from "../../api";
import { exportToCsv } from "../../utils/exportCsv";

const PIPELINE_STAGES = [
  { id: "Applied", label: "Applied", icon: "📝" },
  { id: "Shortlisted", label: "Shortlisted", icon: "📋" },
  { id: "Interview Scheduled", label: "Interview", icon: "🎙️" },
  { id: "Offered", label: "Offer Extended", icon: "🎉" },
];

const TPO_STATUSES = [
  "Applied",
  "Shortlisted",
  "Interview Scheduled",
  "Offered",
  "Rejected",
];

export default function ApplicationsTracker({ refreshKey, onChanged }) {
  const user = getStoredUser();
  const isStudent = String(user?.role || "").toUpperCase() === "STUDENT";
  const canManage = String(user?.role || "").toUpperCase() === "TPO";

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await api.applications();
      setRows(data || []);
    } catch (err) {
      setError(err.message || "Failed to load applications");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [refreshKey]);

  async function updateStatus(id, status) {
    setSavingId(id);
    setError("");
    try {
      const updated = await api.updateApplicationStatus(id, status);
      setRows((prev) => prev.map((r) => (r._id === id ? updated : r)));
      onChanged?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingId("");
    }
  }

  function handleExport() {
    try {
      exportToCsv(
        `applications-${new Date().toISOString().slice(0, 10)}.csv`,
        rows,
        [
          { label: "Student", value: (r) => r.studentId?.name || "" },
          { label: "Roll Number", value: (r) => r.studentId?.rollNumber || "" },
          { label: "Branch", value: (r) => r.studentId?.branch || "" },
          { label: "Company", value: (r) => r.jobId?.companyName || "" },
          { label: "Role", value: (r) => r.jobId?.title || "" },
          { label: "Package LPA", value: (r) => r.jobId?.packageLpa ?? "" },
          { label: "Status", value: (r) => r.status || "" },
          {
            label: "Updated At",
            value: (r) =>
              r.updatedAt ? new Date(r.updatedAt).toLocaleString() : "",
          },
        ]
      );
    } catch (err) {
      setError(err.message);
    }
  }

  const getStageIndex = (status) => {
    if (status === "Rejected") return -1;
    const idx = PIPELINE_STAGES.findIndex((s) => s.id === status);
    return idx >= 0 ? idx : 0;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Offered":
        return "bg-emerald-100 text-emerald-800 border-emerald-300";
      case "Interview Scheduled":
        return "bg-purple-100 text-purple-800 border-purple-300";
      case "Shortlisted":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "Rejected":
        return "bg-rose-100 text-rose-800 border-rose-300";
      case "Applied":
      default:
        return "bg-slate-100 text-slate-800 border-slate-300";
    }
  };

  const filteredRows = statusFilter === "ALL"
    ? rows
    : rows.filter((r) => r.status === statusFilter);

  const stats = {
    total: rows.length,
    interviewing: rows.filter((r) => r.status === "Interview Scheduled" || r.status === "Shortlisted").length,
    offered: rows.filter((r) => r.status === "Offered").length,
    rejected: rows.filter((r) => r.status === "Rejected").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-2xl text-ink font-bold">
            Applications & Recruitment Pipeline
          </h2>
          <p className="text-sm text-muted mt-0.5">
            {isStudent
              ? "Track your submitted applications and live interview & offer progress."
              : "Review student applications and update recruitment pipeline statuses live."}
          </p>
        </div>

        <button
          type="button"
          onClick={handleExport}
          disabled={!rows.length}
          className="rounded-xl border border-line bg-white px-4 py-2 text-xs font-bold text-ink hover:bg-slate-50 disabled:opacity-50 transition shadow-2xs flex items-center gap-2"
        >
          <svg className="w-4 h-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export CSV Report
        </button>
      </div>

      {/* Summary KPI Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-line bg-panel p-3.5 shadow-2xs">
          <p className="text-[10px] uppercase font-semibold text-muted tracking-wider">Total Submitted</p>
          <p className="text-xl font-black text-ink mt-0.5">{stats.total}</p>
        </div>
        <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3.5 shadow-2xs">
          <p className="text-[10px] uppercase font-semibold text-blue-600 tracking-wider">In Pipeline</p>
          <p className="text-xl font-black text-blue-800 mt-0.5">{stats.interviewing}</p>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3.5 shadow-2xs">
          <p className="text-[10px] uppercase font-semibold text-emerald-600 tracking-wider">Offers Received</p>
          <p className="text-xl font-black text-emerald-800 mt-0.5">{stats.offered}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 shadow-2xs">
          <p className="text-[10px] uppercase font-semibold text-muted tracking-wider">Decisions Closed</p>
          <p className="text-xl font-black text-slate-700 mt-0.5">{stats.offered + stats.rejected}</p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 text-red-700 text-sm px-4 py-3 border border-red-100 flex items-center justify-between">
          <span>{error}</span>
          <button type="button" onClick={() => setError("")} className="text-red-500 hover:text-red-700 font-bold ml-2">×</button>
        </div>
      )}

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-line pb-3">
        <span className="text-xs font-semibold text-muted mr-1">Status:</span>
        {["ALL", "Applied", "Shortlisted", "Interview Scheduled", "Offered", "Rejected"].map((st) => (
          <button
            key={st}
            type="button"
            onClick={() => setStatusFilter(st)}
            className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
              statusFilter === st
                ? "bg-brand-600 text-white shadow-2xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {st === "ALL" ? `All (${rows.length})` : st}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="p-12 text-center text-sm text-muted">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-3 border-brand-500 border-t-transparent mb-2" />
          <p>Loading application statuses…</p>
        </div>
      ) : isStudent ? (
        /* STUDENT VIEW: Visual Card Pipeline Cards */
        <div className="space-y-4">
          {filteredRows.map((app) => {
            const currentStageIdx = getStageIndex(app.status);
            const isRejected = app.status === "Rejected";

            return (
              <div
                key={app._id}
                className="rounded-2xl border border-line bg-panel p-5 shadow-xs transition duration-200 hover:shadow-md"
              >
                {/* Top Info Bar */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center text-white font-black text-base shadow-xs">
                      {(app.jobId?.companyName || "?").slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-ink text-base">
                        {app.jobId?.title || "Job Role"}
                      </h3>
                      <p className="text-xs text-muted font-medium">
                        {app.jobId?.companyName || "Company"} · {app.jobId?.packageLpa ? `${app.jobId.packageLpa} LPA` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold border ${getStatusBadge(app.status)}`}>
                      {app.status}
                    </span>
                    <span className="text-[11px] text-muted">
                      Applied {app.createdAt ? new Date(app.createdAt).toLocaleDateString() : ""}
                    </span>
                  </div>
                </div>

                {/* Step-by-Step Pipeline Tracker */}
                <div className="mt-6 pt-4 border-t border-line/60">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted mb-3">
                    Recruitment Stage Pipeline
                  </p>

                  {isRejected ? (
                    <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800 flex items-center gap-2">
                      <span className="text-base">❌</span>
                      <div>
                        <p className="font-bold">Application Status: Rejected</p>
                        <p className="text-[11px] text-rose-600 mt-0.5">
                          Not moving forward at this time. Keep applying to other active placement drives!
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="relative">
                      {/* Step Progress Line */}
                      <div className="grid grid-cols-4 gap-2">
                        {PIPELINE_STAGES.map((stage, idx) => {
                          const isPassed = currentStageIdx >= idx;
                          const isCurrent = currentStageIdx === idx;

                          return (
                            <div key={stage.id} className="flex flex-col items-center text-center">
                              {/* Circle Icon */}
                              <div
                                className={`h-9 w-9 rounded-xl flex items-center justify-center text-sm font-bold transition-all duration-200 ${
                                  isPassed
                                    ? isCurrent
                                      ? "bg-brand-600 text-white ring-4 ring-brand-100 shadow-sm"
                                      : "bg-emerald-500 text-white"
                                    : "bg-slate-100 text-slate-400 border border-line"
                                }`}
                              >
                                {isPassed && !isCurrent ? "✓" : stage.icon}
                              </div>

                              {/* Label */}
                              <p
                                className={`mt-2 text-xs font-bold ${
                                  isCurrent
                                    ? "text-brand-700 font-extrabold"
                                    : isPassed
                                    ? "text-slate-800"
                                    : "text-slate-400"
                                }`}
                              >
                                {stage.label}
                              </p>

                              {/* Subtext */}
                              <span className="text-[10px] text-muted">
                                {isCurrent ? "Current Stage" : isPassed ? "Completed" : "Upcoming"}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {filteredRows.length === 0 && (
            <div className="rounded-2xl border border-line bg-panel p-12 text-center">
              <div className="mx-auto w-12 h-12 rounded-2xl bg-brand-50 flex items-center justify-center text-brand-600 mb-3">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-base font-bold text-ink">No applications in this view</p>
              <p className="text-xs text-muted mt-1">
                Explore the Jobs & Drives tab to discover eligible openings and apply.
              </p>
            </div>
          )}
        </div>
      ) : (
        /* TPO / COMPANY VIEW: Comprehensive Management Table */
        <div className="rounded-2xl border border-line bg-panel overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50/80 text-left text-xs uppercase tracking-wider text-muted border-b border-line">
                <tr>
                  <th className="px-5 py-3.5">Candidate</th>
                  <th className="px-5 py-3.5">Branch / CGPA</th>
                  <th className="px-5 py-3.5">Company & Role</th>
                  <th className="px-5 py-3.5">Package</th>
                  <th className="px-5 py-3.5">Pipeline Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filteredRows.map((app) => (
                  <tr key={app._id} className="hover:bg-slate-50/60 transition">
                    <td className="px-5 py-3.5">
                      <p className="font-bold text-ink">{app.studentId?.name || "Unknown"}</p>
                      <p className="text-xs text-muted font-mono">{app.studentId?.rollNumber || "—"}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-ink font-medium">{app.studentId?.branch || "—"}</p>
                      <p className="text-xs text-muted">
                        CGPA: {app.studentId?.cgpa != null ? Number(app.studentId.cgpa).toFixed(2) : "—"}
                      </p>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-bold text-ink">{app.jobId?.companyName || "Company"}</p>
                      <p className="text-xs text-muted">{app.jobId?.title || "Role"}</p>
                    </td>
                    <td className="px-5 py-3.5 font-bold text-ink">
                      {app.jobId?.packageLpa != null ? `${app.jobId.packageLpa} LPA` : "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold border ${getStatusBadge(app.status)}`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {canManage ? (
                        <select
                          className="rounded-lg border border-line px-2.5 py-1.5 text-xs bg-white font-semibold text-ink outline-none focus:ring-2 focus:ring-brand-500/30"
                          value={app.status}
                          disabled={savingId === app._id}
                          onChange={(e) => updateStatus(app._id, e.target.value)}
                        >
                          {TPO_STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-xs text-muted">—</span>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredRows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-muted">
                      No applications match the current filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
