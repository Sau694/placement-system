import { useState } from "react";
import { api } from "../../api";

export default function StudentProfileCard({ profile, onProfileUpdated }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: profile?.name || "",
    rollNumber: profile?.rollNumber || "",
    branch: profile?.branch || "CSE",
    year: profile?.year || "4th Year",
    cgpa: profile?.cgpa ?? 7.5,
    backlogs: profile?.backlogs ?? 0,
    skills: Array.isArray(profile?.skills) ? profile.skills.join(", ") : "JavaScript, React, Node.js",
    phone: profile?.phone || "",
    resumeLink: profile?.resumeLink || "",
  });

  const [saving, setSaving] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [cardMsg, setCardMsg] = useState("");

  const branches = ["CSE", "IT", "ECE", "Mechanical", "Civil", "EE", "Data Science", "AI/ML"];
  const years = ["1st Year", "2nd Year", "3rd Year", "4th Year"];

  function resolveResumeUrl(url) {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return `http://localhost:3000${url.startsWith("/") ? "" : "/"}${url}`;
  }

  function openEditModal() {
    setForm({
      name: profile?.name || "",
      rollNumber: profile?.rollNumber || "",
      branch: profile?.branch || "CSE",
      year: profile?.year || "4th Year",
      cgpa: profile?.cgpa ?? 7.5,
      backlogs: profile?.backlogs ?? 0,
      skills: Array.isArray(profile?.skills) ? profile.skills.join(", ") : "JavaScript, React, Node.js",
      phone: profile?.phone || "",
      resumeLink: profile?.resumeLink || "",
    });
    setError("");
    setSuccessMsg("");
    setEditing(true);
  }

  async function handleResumeUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const isPdf =
      file.name.toLowerCase().endsWith(".pdf") ||
      (file.type && file.type.toLowerCase().includes("pdf"));
    if (!isPdf) {
      setError("Please select a valid PDF file for resume upload");
      e.target.value = "";
      return;
    }

    setUploadingResume(true);
    setError("");
    setSuccessMsg("");
    try {
      const res = await api.uploadResume(file);
      const fileUrl = res.url || res.fullUrl || resolveResumeUrl(res.resumeUrl);
      setForm((prev) => ({
        ...prev,
        resumeLink: fileUrl,
        resumeOriginalName: res.originalName || file.name,
      }));
      setSuccessMsg(`✓ "${file.name}" uploaded successfully! Click Save Changes to apply.`);
      setCardMsg(`✓ Resume uploaded successfully!`);
    } catch (err) {
      console.error("[MODAL UPLOAD ERROR]", err);
      setError(err.message || "Failed to upload resume");
    } finally {
      setUploadingResume(false);
      e.target.value = "";
    }
  }

  async function handleDirectCardUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const isPdf =
      file.name.toLowerCase().endsWith(".pdf") ||
      (file.type && file.type.toLowerCase().includes("pdf"));
    if (!isPdf) {
      setCardMsg("Error: Please select a valid PDF file");
      e.target.value = "";
      return;
    }

    setUploadingResume(true);
    setCardMsg("Uploading PDF resume...");
    try {
      const res = await api.uploadResume(file);
      const fileUrl = res.url || res.fullUrl || resolveResumeUrl(res.resumeUrl);

      // Instant state update for user card UI
      onProfileUpdated?.({
        ...(profile || {}),
        resumeLink: fileUrl,
        resumeOriginalName: res.originalName || file.name,
      });

      setCardMsg(`✓ Resume "${file.name}" uploaded and saved successfully!`);
      setTimeout(() => setCardMsg(""), 6000);
    } catch (err) {
      console.error("[DIRECT UPLOAD ERROR]", err);
      setCardMsg(`Upload failed: ${err.message || "Request failed"}`);
    } finally {
      setUploadingResume(false);
      e.target.value = "";
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccessMsg("");

    try {
      const parsedSkills = form.skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const payload = {
        name: form.name.trim(),
        rollNumber: form.rollNumber.trim(),
        branch: form.branch.trim(),
        year: form.year,
        cgpa: Number(form.cgpa),
        backlogs: Number(form.backlogs),
        skills: parsedSkills,
        phone: form.phone.trim(),
        resumeLink: form.resumeLink.trim(),
      };

      const updated = await api.updateMeStudent(payload);
      onProfileUpdated?.(updated);
      setSuccessMsg("Profile updated successfully!");
      setTimeout(() => {
        setEditing(false);
      }, 700);
    } catch (err) {
      setError(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  }

  const skillsList = Array.isArray(profile?.skills) && profile.skills.length > 0
    ? profile.skills
    : ["JavaScript", "React", "Node.js"];

  const cgpaValue = profile?.cgpa != null ? Number(profile.cgpa).toFixed(2) : "7.50";
  const backlogsCount = profile?.backlogs ?? 0;

  return (
    <>
      <div className="rounded-2xl border border-line bg-panel p-5 shadow-xs transition duration-200 hover:shadow-md">
        {/* Header with Avatar and Basic Info */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="h-13 w-13 rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                {(profile?.name || "Student")
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase()}
              </div>
              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-ink text-base truncate">
                  {profile?.name || "Student Profile"}
                </h3>
              </div>
              <p className="text-xs text-muted font-mono">{profile?.rollNumber || "No Roll No"}</p>
              <p className="text-[11px] text-brand-700 font-semibold mt-0.5">
                {profile?.branch || "CSE"} · {profile?.year || "4th Year"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={openEditModal}
            className="rounded-xl border border-line bg-white hover:bg-slate-50 text-ink text-xs font-semibold px-3 py-1.5 transition flex items-center gap-1.5 shrink-0 shadow-2xs"
          >
            <svg className="w-3.5 h-3.5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Edit Profile
          </button>
        </div>

        {/* Academic Stats Grid */}
        <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-line/70">
          <div className="rounded-xl bg-slate-50/80 border border-line/60 p-2.5">
            <p className="text-[10px] uppercase tracking-wider font-semibold text-muted">CGPA</p>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-lg font-extrabold text-ink">{cgpaValue}</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                Number(cgpaValue) >= 7.5
                  ? "bg-emerald-100 text-emerald-800"
                  : Number(cgpaValue) >= 6.0
                  ? "bg-blue-100 text-blue-800"
                  : "bg-amber-100 text-amber-800"
              }`}>
                {Number(cgpaValue) >= 7.5 ? "First Class" : "Passing"}
              </span>
            </div>
          </div>

          <div className="rounded-xl bg-slate-50/80 border border-line/60 p-2.5">
            <p className="text-[10px] uppercase tracking-wider font-semibold text-muted">Backlogs</p>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className={`text-lg font-extrabold ${backlogsCount === 0 ? "text-emerald-700" : "text-amber-700"}`}>
                {backlogsCount}
              </span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                backlogsCount === 0 ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
              }`}>
                {backlogsCount === 0 ? "Zero Backlogs" : `${backlogsCount} Active`}
              </span>
            </div>
          </div>
        </div>

        {/* Skills Tag Section */}
        <div className="mt-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted mb-1.5">
            Skills & Competencies
          </p>
          <div className="flex flex-wrap gap-1.5">
            {skillsList.map((skill, idx) => (
              <span
                key={idx}
                className="rounded-lg bg-brand-50 border border-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-700"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Direct Card Alert Message */}
        {cardMsg && (
          <div className={`mt-3 rounded-xl p-2.5 text-xs font-semibold flex items-center justify-between ${
            cardMsg.startsWith("Error") || cardMsg.startsWith("Upload failed")
              ? "bg-red-50 text-red-700 border border-red-100"
              : "bg-emerald-50 text-emerald-700 border border-emerald-100"
          }`}>
            <span>{cardMsg}</span>
            <button type="button" onClick={() => setCardMsg("")} className="ml-2 font-bold opacity-70 hover:opacity-100">×</button>
          </div>
        )}

        {/* Resume Status Card */}
        <div className="mt-4 pt-3.5 border-t border-line/70 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className={`p-2 rounded-lg border shrink-0 ${
              profile?.resumeLink ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-red-50 text-red-600 border-red-100"
            }`}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-ink truncate">
                {profile?.resumeLink ? "Resume Uploaded (View/Download)" : "No Resume Attached"}
              </p>
              <p className="text-[10px] text-muted truncate">
                {profile?.resumeLink ? "Verified PDF document" : "Upload PDF to boost shortlisting"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {profile?.resumeLink && (
              <a
                href={resolveResumeUrl(profile.resumeLink)}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg bg-slate-900 hover:bg-black text-white text-xs font-semibold px-2.5 py-1.5 transition flex items-center gap-1"
                title="View and download verified PDF resume"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                View PDF
              </a>
            )}

            <label className="cursor-pointer rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold px-2.5 py-1.5 transition flex items-center gap-1 shadow-2xs">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              {uploadingResume ? "..." : profile?.resumeLink ? "Replace" : "Upload"}
              <input
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                disabled={uploadingResume}
                onChange={handleDirectCardUpload}
              />
            </label>
          </div>
        </div>
      </div>

      {/* Edit Profile & Resume Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white border border-line shadow-2xl p-6">
            <div className="flex items-center justify-between pb-4 border-b border-line">
              <div>
                <h3 className="font-[family-name:var(--font-display)] text-xl font-bold text-ink">
                  Edit Academic Profile & Resume
                </h3>
                <p className="text-xs text-muted mt-0.5">
                  Update your academic info, CGPA, and resume to match job drive criteria.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded-lg border border-line p-1.5 text-muted hover:text-ink hover:bg-slate-50 text-sm"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {error && (
              <p className="mt-4 rounded-lg bg-red-50 text-red-700 text-xs px-3 py-2 border border-red-100">
                {error}
              </p>
            )}
            {successMsg && (
              <p className="mt-4 rounded-lg bg-emerald-50 text-emerald-700 text-xs px-3 py-2 border border-emerald-100">
                {successMsg}
              </p>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block text-xs font-semibold text-ink">
                  Full Name
                  <input
                    type="text"
                    required
                    className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                    value={form.name}
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </label>

                <label className="block text-xs font-semibold text-ink">
                  Roll Number
                  <input
                    type="text"
                    required
                    className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 font-mono"
                    value={form.rollNumber}
                    onChange={(e) => setForm((prev) => ({ ...prev, rollNumber: e.target.value }))}
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block text-xs font-semibold text-ink">
                  Branch
                  <select
                    className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                    value={form.branch}
                    onChange={(e) => setForm((prev) => ({ ...prev, branch: e.target.value }))}
                  >
                    {branches.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block text-xs font-semibold text-ink">
                  Academic Year
                  <select
                    className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                    value={form.year}
                    onChange={(e) => setForm((prev) => ({ ...prev, year: e.target.value }))}
                  >
                    {years.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block text-xs font-semibold text-ink">
                  CGPA (0 - 10)
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    required
                    className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 font-bold"
                    value={form.cgpa}
                    onChange={(e) => setForm((prev) => ({ ...prev, cgpa: e.target.value }))}
                  />
                </label>

                <label className="block text-xs font-semibold text-ink">
                  Active Backlogs
                  <input
                    type="number"
                    min="0"
                    required
                    className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 font-bold"
                    value={form.backlogs}
                    onChange={(e) => setForm((prev) => ({ ...prev, backlogs: e.target.value }))}
                  />
                </label>
              </div>

              <label className="block text-xs font-semibold text-ink">
                Skills (comma-separated)
                <input
                  type="text"
                  placeholder="e.g. JavaScript, React, Python, SQL"
                  className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                  value={form.skills}
                  onChange={(e) => setForm((prev) => ({ ...prev, skills: e.target.value }))}
                />
              </label>

              <label className="block text-xs font-semibold text-ink">
                Phone Number
                <input
                  type="tel"
                  placeholder="+91 9876543210"
                  className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                  value={form.phone}
                  onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                />
              </label>

              {/* Resume Upload & Link Section */}
              <div className="rounded-xl border border-line bg-slate-50 p-4 space-y-3">
                <p className="text-xs font-bold text-ink">Resume PDF Management</p>
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                  <label className="cursor-pointer inline-flex items-center gap-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold px-3 py-2 transition shadow-xs">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    {uploadingResume ? "Uploading PDF..." : "Upload New PDF Resume"}
                    <input
                      type="file"
                      accept=".pdf,application/pdf"
                      className="hidden"
                      onChange={handleResumeUpload}
                      disabled={uploadingResume}
                    />
                  </label>

                  {form.resumeLink && (
                    <span className="text-xs text-emerald-700 font-semibold truncate flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      Resume attached
                    </span>
                  )}
                </div>

                <div>
                  <p className="text-[11px] text-muted mb-1">Or direct resume link URL:</p>
                  <input
                    type="url"
                    placeholder="https://example.com/my-resume.pdf"
                    className="w-full rounded-lg border border-line bg-white px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-brand-500/30"
                    value={form.resumeLink}
                    onChange={(e) => setForm((prev) => ({ ...prev, resumeLink: e.target.value }))}
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-line flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="rounded-lg border border-line px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || uploadingResume}
                  className="rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-5 py-2 transition disabled:opacity-60 shadow-sm"
                >
                  {saving ? "Saving Changes..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
