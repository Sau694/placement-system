import { useEffect, useMemo, useState } from "react";
import { api, getStoredUser } from "../../api";
import StudentProfileCard from "../student/StudentProfileCard";
import StudentStatBar from "../student/StudentStatBar";

export default function JobsDrives({ refreshKey, onChanged }) {
  const user = getStoredUser();
  const isStudent = String(user?.role || "").toUpperCase() === "STUDENT";
  const canViewEligible = ["TPO", "COMPANY"].includes(String(user?.role || "").toUpperCase());

  const [jobs, setJobs] = useState([]);
  const [myApps, setMyApps] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [eligibleModal, setEligibleModal] = useState(null);
  const [eligibleLoading, setEligibleLoading] = useState(false);
  const [applyingId, setApplyingId] = useState("");

  // Filters and search controls
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("ALL");
  const [eligibilityFilter, setEligibilityFilter] = useState("ALL"); // ALL, ELIGIBLE, INELIGIBLE, APPLIED
  const [sortBy, setSortBy] = useState("NEWEST"); // NEWEST, PACKAGE_HIGH, CGPA_LOW

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const jobsData = await api.jobs();
        if (cancelled) return;
        setJobs(jobsData || []);

        if (isStudent) {
          const [apps, me] = await Promise.all([
            api.applications().catch(() => []),
            api.meStudent().catch(() => null),
          ]);
          if (cancelled) return;
          setMyApps(apps || []);
          setProfile(me);
        }
      } catch (err) {
        if (!cancelled) setError(err.message || "Failed to load drives");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshKey, isStudent]);

  function getApplicationForJob(jobId) {
    return myApps.find(
      (a) => String(a.jobId?._id || a.jobId) === String(jobId)
    );
  }

  function clientEligibility(job) {
    if (!profile) {
      return {
        ok: false,
        reason: "Profile loading or incomplete",
        reasons: ["Profile not loaded"],
      };
    }
    const reasons = [];
    if (Number(profile.cgpa) < Number(job.minCgpa)) {
      reasons.push(`CGPA ${Number(profile.cgpa).toFixed(1)} < Min ${job.minCgpa}`);
    }
    const maxBacklogs = job.maxBacklogs ?? 0;
    if (Number(profile.backlogs) > Number(maxBacklogs)) {
      reasons.push(`Backlogs (${profile.backlogs}) > Max ${maxBacklogs}`);
    }
    if (
      job.allowedBranches?.length &&
      !job.allowedBranches.includes(profile.branch)
    ) {
      reasons.push(`Branch '${profile.branch}' not in [${job.allowedBranches.join(", ")}]`);
    }
    const isExpired = job.deadline && new Date(job.deadline) < new Date();
    if (isExpired) {
      reasons.push("Application deadline has passed");
    }

    return {
      ok: reasons.length === 0,
      reason: reasons.join(" · "),
      reasons,
      isExpired,
    };
  }

  async function handleApply(job) {
    const check = clientEligibility(job);
    if (!check.ok) {
      setError(check.reason);
      return;
    }

    setApplyingId(job._id);
    setError("");
    setSuccess("");
    try {
      await api.applyToJob(job._id);
      setSuccess(`🎉 Successfully applied to ${job.companyName} for ${job.title}!`);
      const [apps, jobsData] = await Promise.all([
        api.applications(),
        api.jobs(),
      ]);
      setMyApps(apps || []);
      setJobs(jobsData || []);
      onChanged?.();
    } catch (err) {
      setError(err.message || "Application submission failed");
    } finally {
      setApplyingId("");
    }
  }

  async function viewEligible(job) {
    setEligibleLoading(true);
    setError("");
    try {
      const data = await api.eligibleStudents(job._id);
      setEligibleModal(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setEligibleLoading(false);
    }
  }

  // Calculate statistics
  const eligibleDrivesCount = useMemo(() => {
    if (!isStudent || !profile) return 0;
    return jobs.filter((j) => clientEligibility(j).ok).length;
  }, [jobs, profile, isStudent]);

  const offersCount = useMemo(() => {
    return myApps.filter((a) => a.status === "Offered").length;
  }, [myApps]);

  // Filter and sort jobs
  const filteredJobs = useMemo(() => {
    return jobs
      .filter((job) => {
        // Search query filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = (job.title || "").toLowerCase().includes(q);
          const matchCompany = (job.companyName || "").toLowerCase().includes(q);
          if (!matchTitle && !matchCompany) return false;
        }

        // Branch filter
        if (selectedBranch !== "ALL") {
          if (job.allowedBranches?.length && !job.allowedBranches.includes(selectedBranch)) {
            return false;
          }
        }

        // Eligibility tab filter for student
        if (isStudent && profile) {
          const app = getApplicationForJob(job._id);
          const check = clientEligibility(job);

          if (eligibilityFilter === "ELIGIBLE" && !check.ok) return false;
          if (eligibilityFilter === "INELIGIBLE" && check.ok) return false;
          if (eligibilityFilter === "APPLIED" && !app) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "PACKAGE_HIGH") return Number(b.packageLpa) - Number(a.packageLpa);
        if (sortBy === "CGPA_LOW") return Number(a.minCgpa) - Number(b.minCgpa);
        if (sortBy === "APPLICANTS") return Number(b.applicantCount || 0) - Number(a.applicantCount || 0);
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      });
  }, [jobs, searchQuery, selectedBranch, eligibilityFilter, sortBy, isStudent, profile, myApps]);

  return (
    <div className="space-y-6">
      {/* Top Stat Summary Bar for Student */}
      {isStudent && (
        <StudentStatBar
          eligibleCount={eligibleDrivesCount}
          totalDrives={jobs.length}
          appliedCount={myApps.length}
          offersCount={offersCount}
          profile={profile}
        />
      )}

      {/* Main Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-2xl text-ink font-bold">
            Jobs & Placement Drives
          </h2>
          <p className="text-sm text-muted mt-0.5">
            {isStudent
              ? "Discover active campus drives, verify smart eligibility, and apply with 1 click."
              : "Review active recruitment drives and assess candidate eligibility."}
          </p>
        </div>
      </div>

      {/* Feedback Alerts */}
      {error && (
        <div className="rounded-xl bg-red-50 text-red-700 text-sm px-4 py-3 border border-red-100 flex items-center justify-between">
          <span>{error}</span>
          <button type="button" onClick={() => setError("")} className="text-red-500 hover:text-red-700 font-bold ml-2">×</button>
        </div>
      )}
      {success && (
        <div className="rounded-xl bg-emerald-50 text-emerald-700 text-sm px-4 py-3 border border-emerald-100 flex items-center justify-between">
          <span>{success}</span>
          <button type="button" onClick={() => setSuccess("")} className="text-emerald-500 hover:text-emerald-700 font-bold ml-2">×</button>
        </div>
      )}

      {/* Main Grid Layout: Student Profile on Top Right / Sidebar, Jobs on Main Column */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Jobs Section (lg:col-span-8 if student, lg:col-span-12 if TPO) */}
        <div className={isStudent ? "lg:col-span-8 space-y-4" : "lg:col-span-12 space-y-4"}>
          {/* Repositioned Search & Filter Controls Bar */}
          <div className="rounded-2xl border border-line bg-panel p-4 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row gap-2.5">
              {/* Search input */}
              <div className="relative flex-1">
                <svg
                  className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search by company or role..."
                  className="w-full rounded-xl border border-line bg-white pl-9.5 pr-3.5 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Branch filter */}
              <select
                className="rounded-xl border border-line bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500/30 text-ink"
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
              >
                <option value="ALL">All Branches</option>
                <option value="CSE">CSE</option>
                <option value="IT">IT</option>
                <option value="ECE">ECE</option>
                <option value="Mechanical">Mechanical</option>
                <option value="Civil">Civil</option>
                <option value="EE">EE</option>
              </select>

              {/* Sort selector */}
              <select
                className="rounded-xl border border-line bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500/30 text-ink"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="NEWEST">Newest First</option>
                <option value="PACKAGE_HIGH">Highest Package (LPA)</option>
                <option value="CGPA_LOW">Lowest CGPA Requirement</option>
                <option value="APPLICANTS">Most Applicants</option>
              </select>
            </div>

            {/* Eligibility Quick Filter Tabs (for Student) */}
            {isStudent && (
              <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-line/60">
                <span className="text-xs font-semibold text-muted mr-1">Filter:</span>
                {[
                  { id: "ALL", label: `All Drives (${jobs.length})` },
                  { id: "ELIGIBLE", label: `🟢 Eligible Only (${eligibleDrivesCount})` },
                  { id: "APPLIED", label: `🔵 Applied (${myApps.length})` },
                  { id: "INELIGIBLE", label: `🔴 Ineligible (${jobs.length - eligibleDrivesCount})` },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setEligibilityFilter(tab.id)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                      eligibilityFilter === tab.id
                        ? "bg-brand-600 text-white shadow-2xs"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Drives Cards Grid */}
          {loading ? (
            <div className="p-12 text-center text-sm text-muted">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-3 border-brand-500 border-t-transparent mb-2" />
              <p>Loading placement drives…</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredJobs.map((job) => {
                const app = isStudent ? getApplicationForJob(job._id) : null;
                const check = isStudent ? clientEligibility(job) : { ok: true, reasons: [] };

                return (
                  <article
                    key={job._id}
                    className="rounded-2xl border border-line bg-panel p-5 shadow-xs transition duration-200 hover:shadow-md hover:border-brand-200 flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Row: Company initial & Status Badge */}
                      <div className="flex items-start justify-between gap-2.5">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 shrink-0 rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-400 border border-brand-200 flex items-center justify-center text-white font-black text-base shadow-xs">
                            {(job.companyName || "?").slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-bold text-ink text-base leading-snug">
                              {job.title}
                            </h3>
                            <p className="text-xs font-medium text-muted">
                              {job.companyName}
                            </p>
                          </div>
                        </div>

                        {/* Smart Eligibility / Application Status Badge */}
                        {isStudent && (
                          <div>
                            {app ? (
                              <span className="inline-flex items-center rounded-full bg-blue-50 text-blue-700 px-2.5 py-1 text-xs font-bold border border-blue-200">
                                Applied · {app.status}
                              </span>
                            ) : check.ok ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 px-2.5 py-1 text-xs font-bold border border-emerald-200">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                Eligible
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-red-50 text-red-700 px-2.5 py-1 text-xs font-bold border border-red-200">
                                <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                                Ineligible
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Package and Criteria Meta Grid */}
                      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                        <div className="rounded-xl bg-brand-50/70 border border-brand-100/80 p-2">
                          <p className="text-[10px] uppercase font-semibold text-brand-600">CTC Package</p>
                          <p className="font-extrabold text-brand-800 text-sm mt-0.5">{job.packageLpa} LPA</p>
                        </div>
                        <div className="rounded-xl bg-slate-50 border border-line/60 p-2">
                          <p className="text-[10px] uppercase font-semibold text-muted">Min CGPA</p>
                          <p className="font-bold text-ink text-sm mt-0.5">{job.minCgpa}</p>
                        </div>
                        <div className="rounded-xl bg-slate-50 border border-line/60 p-2">
                          <p className="text-[10px] uppercase font-semibold text-muted">Max Backlogs</p>
                          <p className="font-bold text-ink text-sm mt-0.5">{job.maxBacklogs ?? 0}</p>
                        </div>
                        <div className="rounded-xl bg-slate-50 border border-line/60 p-2">
                          <p className="text-[10px] uppercase font-semibold text-muted">Deadline</p>
                          <p className="font-bold text-ink text-xs mt-0.5 truncate">
                            {job.deadline ? new Date(job.deadline).toLocaleDateString() : "Open"}
                          </p>
                        </div>
                      </div>

                      {/* Allowed Branches Pill */}
                      <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-muted">
                        <span className="font-semibold text-slate-700">Branches:</span>
                        <span className="truncate">
                          {(job.allowedBranches || []).length > 0
                            ? job.allowedBranches.join(", ")
                            : "All Branches Eligible"}
                        </span>
                      </div>

                      {/* Ineligibility Reason Note */}
                      {isStudent && !check.ok && !app && (
                        <div className="mt-3 rounded-lg bg-amber-50/90 border border-amber-200/70 p-2 text-[11px] text-amber-800">
                          <p className="font-semibold mb-0.5">Eligibility mismatch:</p>
                          <ul className="list-disc list-inside space-y-0.5 text-amber-700">
                            {check.reasons.map((r, i) => (
                              <li key={i}>{r}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-4 pt-3 border-t border-line/60 flex items-center justify-between gap-2">
                      <span className="text-xs text-muted">
                        👥 {job.applicantCount ?? 0} applied
                      </span>

                      {canViewEligible && (
                        <button
                          type="button"
                          onClick={() => viewEligible(job)}
                          disabled={eligibleLoading}
                          className="rounded-xl border border-line bg-white hover:bg-slate-50 text-ink text-xs font-semibold px-3.5 py-2 transition shadow-2xs"
                        >
                          View Eligible Candidates
                        </button>
                      )}

                      {isStudent && (
                        <button
                          type="button"
                          onClick={() => handleApply(job)}
                          disabled={Boolean(app) || !check.ok || applyingId === job._id}
                          className={`rounded-xl px-4 py-2 text-xs font-bold transition shadow-xs flex items-center gap-1.5 ${
                            app
                              ? "bg-slate-100 text-slate-500 cursor-default border border-line"
                              : check.ok
                              ? "bg-brand-600 hover:bg-brand-700 text-white shadow-brand-500/20"
                              : "bg-slate-100 text-slate-400 cursor-not-allowed border border-line"
                          }`}
                        >
                          {applyingId === job._id ? (
                            <>
                              <span className="inline-block animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" />
                              Applying...
                            </>
                          ) : app ? (
                            `Applied (${app.status})`
                          ) : check.ok ? (
                            "Apply Now"
                          ) : (
                            "Ineligible to Apply"
                          )}
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}

              {filteredJobs.length === 0 && (
                <div className="col-span-full rounded-2xl border border-line bg-panel p-10 text-center">
                  <p className="text-base font-bold text-ink">No placement drives found</p>
                  <p className="text-xs text-muted mt-1">
                    Try adjusting your search terms or branch / eligibility filters.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Top-Right / Sidebar Profile & Resume Card (Only for Student) */}
        {isStudent && (
          <aside className="lg:col-span-4 lg:sticky lg:top-20 space-y-4">
            <StudentProfileCard
              profile={profile}
              onProfileUpdated={(updated) => {
                setProfile(updated);
                setSuccess("Profile updated! Eligibility re-calculated.");
                onChanged?.();
              }}
            />
          </aside>
        )}
      </div>

      {/* Eligible Students Modal for TPO */}
      {eligibleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-3xl max-h-[85vh] overflow-hidden rounded-2xl bg-white border border-line shadow-2xl flex flex-col">
            <div className="px-6 py-4 border-b border-line flex items-start justify-between gap-3">
              <div>
                <h3 className="font-bold text-ink text-lg">
                  Eligible Candidates · {eligibleModal.job?.title}
                </h3>
                <p className="text-xs text-muted mt-0.5">
                  {eligibleModal.job?.companyName} · Min CGPA {eligibleModal.job?.minCgpa} · Max backlogs {eligibleModal.job?.maxBacklogs ?? 0} · {eligibleModal.count} eligible students
                </p>
              </div>
              <button
                type="button"
                className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold hover:bg-slate-50"
                onClick={() => setEligibleModal(null)}
              >
                Close
              </button>
            </div>
            <div className="overflow-auto p-4">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-muted">
                  <tr>
                    <th className="px-4 py-3">Student Name</th>
                    <th className="px-4 py-3">Branch</th>
                    <th className="px-4 py-3">CGPA</th>
                    <th className="px-4 py-3">Backlogs</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(eligibleModal.eligibleStudents || []).map((s) => (
                    <tr key={s._id} className="border-t border-line">
                      <td className="px-4 py-3 font-medium text-ink">{s.name}</td>
                      <td className="px-4 py-3 text-muted">{s.branch}</td>
                      <td className="px-4 py-3 font-bold text-ink">{Number(s.cgpa).toFixed(2)}</td>
                      <td className="px-4 py-3">{s.backlogs ?? 0}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-0.5 text-xs font-bold">
                          Eligible
                        </span>
                      </td>
                    </tr>
                  ))}
                  {(eligibleModal.eligibleStudents || []).length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-muted">
                        No eligible students found for this drive criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
