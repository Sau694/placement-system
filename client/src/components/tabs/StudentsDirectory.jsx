import { useEffect, useMemo, useState } from "react";
import { api } from "../../api";
import { exportToCsv } from "../../utils/exportCsv";

export default function StudentsDirectory({ refreshKey }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [branch, setBranch] = useState("");
  const [minCgpa, setMinCgpa] = useState("");
  const [placementStatus, setPlacementStatus] = useState("");
  const [selected, setSelected] = useState(null);
  const [details, setDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const data = await api.students({
          search,
          branch,
          minCgpa,
          placementStatus,
        });
        if (!cancelled) setStudents(data);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [search, branch, minCgpa, placementStatus, refreshKey]);

  async function openDetails(student) {
    setSelected(student);
    setDetails(null);
    setDetailsLoading(true);
    try {
      const data = await api.studentDetails(student._id);
      setDetails(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setDetailsLoading(false);
    }
  }

  const branches = useMemo(
    () => [...new Set(students.map((s) => s.branch).filter(Boolean))],
    [students]
  );

  function handleExport() {
    try {
      exportToCsv(
        `students-${new Date().toISOString().slice(0, 10)}.csv`,
        students,
        [
          { label: "Name", key: "name" },
          { label: "Roll Number", key: "rollNumber" },
          { label: "Branch", key: "branch" },
          { label: "CGPA", key: "cgpa" },
          { label: "Backlogs", key: "backlogs" },
          { label: "Email", key: "email" },
          { label: "Placement Status", key: "placementStatus" },
          { label: "Resume Link", key: "resumeLink" },
        ]
      );
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-2xl text-ink">
            Students Directory
          </h2>
          <p className="text-sm text-muted mt-1">
            Search and filter student profiles with live MongoDB queries.
          </p>
        </div>
        <button
          type="button"
          onClick={handleExport}
          disabled={!students.length}
          className="rounded-lg border border-line bg-white px-3 py-2 text-sm font-semibold text-ink hover:bg-slate-50 disabled:opacity-50"
        >
          Export to CSV
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <input
          className="rounded-lg border border-line px-3 py-2 text-sm"
          placeholder="Search name, roll, email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="rounded-lg border border-line px-3 py-2 text-sm"
          value={branch}
          onChange={(e) => setBranch(e.target.value)}
        >
          <option value="">All Branches</option>
          {["CSE", "IT", "ECE", "Mechanical", "ME", ...branches].filter(
            (v, i, a) => a.indexOf(v) === i
          ).map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
        <input
          type="number"
          min="0"
          max="10"
          step="0.1"
          className="rounded-lg border border-line px-3 py-2 text-sm"
          placeholder="Min CGPA"
          value={minCgpa}
          onChange={(e) => setMinCgpa(e.target.value)}
        />
        <select
          className="rounded-lg border border-line px-3 py-2 text-sm"
          value={placementStatus}
          onChange={(e) => setPlacementStatus(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="Placed">Placed</option>
          <option value="Eligible">Eligible</option>
          <option value="In Process">In Process</option>
        </select>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 text-red-700 text-sm px-3 py-2">{error}</p>
      )}

      <div className="rounded-xl border border-line bg-panel overflow-hidden shadow-sm">
        {loading ? (
          <p className="p-6 text-sm text-muted">Loading students…</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Roll</th>
                  <th className="px-4 py-3">Branch</th>
                  <th className="px-4 py-3">CGPA</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s._id} className="border-t border-line hover:bg-slate-50/80">
                    <td className="px-4 py-3 font-medium text-ink">{s.name}</td>
                    <td className="px-4 py-3">{s.rollNumber}</td>
                    <td className="px-4 py-3">{s.branch}</td>
                    <td className="px-4 py-3">{Number(s.cgpa).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <StatusPill status={s.placementStatus || "Eligible"} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => openDetails(s)}
                        className="text-brand-700 font-semibold hover:underline"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
                {students.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted">
                      No students match the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-40 flex justify-end bg-slate-900/40">
          <button
            type="button"
            className="flex-1"
            aria-label="Close drawer"
            onClick={() => setSelected(null)}
          />
          <aside className="w-full max-w-md h-full bg-panel shadow-2xl border-l border-line p-5 overflow-y-auto">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-ink">{selected.name}</h3>
                <p className="text-sm text-muted">{selected.email || "No email on file"}</p>
              </div>
              <button
                type="button"
                className="rounded-lg border border-line px-2.5 py-1 text-sm"
                onClick={() => setSelected(null)}
              >
                Close
              </button>
            </div>

            {detailsLoading ? (
              <p className="mt-6 text-sm text-muted">Loading details…</p>
            ) : details ? (
              <div className="mt-6 space-y-4 text-sm">
                <Info label="Roll Number" value={details.student.rollNumber} />
                <Info label="Branch" value={details.student.branch} />
                <Info label="CGPA" value={Number(details.student.cgpa).toFixed(2)} />
                <Info label="Backlogs" value={details.student.backlogs} />
                <Info
                  label="Placement Status"
                  value={details.student.placementStatus || "Eligible"}
                />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                    Resume
                  </p>
                  {details.student.resumeLink ? (
                    <a
                      href={details.student.resumeLink}
                      target="_blank"
                      rel="noreferrer"
                      className="text-brand-700 font-semibold hover:underline break-all"
                    >
                      {details.student.resumeLink}
                    </a>
                  ) : (
                    <p className="text-muted">No resume link provided</p>
                  )}
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-2">
                    Applied Jobs
                  </p>
                  <div className="space-y-2">
                    {(details.applications || []).length === 0 && (
                      <p className="text-muted">No applications yet.</p>
                    )}
                    {(details.applications || []).map((app) => (
                      <div
                        key={app._id}
                        className="rounded-lg border border-line bg-slate-50 px-3 py-2"
                      >
                        <p className="font-semibold text-ink">
                          {app.jobId?.title || "Job"} · {app.jobId?.companyName || "Company"}
                        </p>
                        <p className="text-xs text-muted mt-0.5">{app.status}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </aside>
        </div>
      )}
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="font-medium text-ink mt-0.5">{value}</p>
    </div>
  );
}

function StatusPill({ status }) {
  const map = {
    Placed: "bg-emerald-50 text-emerald-700 border-emerald-100",
    Eligible: "bg-sky-50 text-sky-700 border-sky-100",
    "In Process": "bg-amber-50 text-amber-700 border-amber-100",
  };
  return (
    <span
      className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${
        map[status] || "bg-slate-50 text-slate-700 border-slate-200"
      }`}
    >
      {status}
    </span>
  );
}
