import { useEffect, useState } from "react";
import { api, getStoredUser } from "../../api";

const emptyStudent = {
  name: "",
  rollNumber: "",
  branch: "CSE",
  cgpa: "",
  backlogs: "0",
  email: "",
  resumeLink: "",
};

const emptyJob = {
  companyName: "",
  title: "",
  packageLpa: "",
  minCgpa: "7.0",
  maxBacklogs: "0",
  allowedBranches: "CSE, IT, ECE",
  deadline: "",
};

export default function AddRecords({ onCreated }) {
  const role = getStoredUser()?.role;
  const canAddStudent = role === "TPO";
  const [mode, setMode] = useState(canAddStudent ? "student" : "job");
  const [studentForm, setStudentForm] = useState(emptyStudent);
  const [jobForm, setJobForm] = useState(emptyJob);
  const [appForm, setAppForm] = useState({ studentId: "", jobId: "" });
  const [students, setStudents] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [s, j] = await Promise.all([api.students(), api.jobs()]);
        setStudents(s);
        setJobs(j);
      } catch {
        /* non-blocking for form lists */
      }
    })();
  }, []);

  async function handleResumeUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    setMessage("");
    try {
      const data = await api.uploadResume(file);
      setStudentForm((prev) => ({ ...prev, resumeLink: data.url }));
      setMessage(`Resume uploaded. Document link ready.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function submitStudent(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const created = await api.createStudent({
        ...studentForm,
        cgpa: Number(studentForm.cgpa),
        backlogs: Number(studentForm.backlogs) || 0,
      });
      setStudentForm(emptyStudent);
      setMessage(`Student "${created.name}" saved to MongoDB.`);
      onCreated?.();
      setStudents((prev) => [created, ...prev]);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function submitJob(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const created = await api.createJob({
        companyName: jobForm.companyName,
        title: jobForm.title,
        packageLpa: Number(jobForm.packageLpa),
        minCgpa: Number(jobForm.minCgpa),
        maxBacklogs: Number(jobForm.maxBacklogs) || 0,
        allowedBranches: jobForm.allowedBranches,
        deadline: jobForm.deadline || null,
      });
      setJobForm(emptyJob);
      setMessage(`Drive "${created.title}" posted to MongoDB.`);
      onCreated?.();
      setJobs((prev) => [created, ...prev]);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function submitApplication(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await api.createApplication(appForm);
      setAppForm({ studentId: "", jobId: "" });
      setMessage("Application created and synced to MongoDB.");
      onCreated?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-[family-name:var(--font-display)] text-2xl text-ink">
          Add Records
        </h2>
        <p className="text-sm text-muted mt-1">
          Centralized forms for students, job drives, and applications.
        </p>
      </div>

      <div className="inline-flex rounded-lg border border-line bg-panel p-1 gap-1">
        {[
          canAddStudent && { id: "student", label: "New Student" },
          { id: "job", label: "New Job Drive" },
          canAddStudent && { id: "application", label: "New Application" },
        ]
          .filter(Boolean)
          .map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setMode(tab.id)}
              className={`rounded-md px-3 py-1.5 text-sm font-semibold ${
                mode === tab.id
                  ? "bg-brand-600 text-white"
                  : "text-muted hover:text-ink"
              }`}
            >
              {tab.label}
            </button>
          ))}
      </div>

      {message && (
        <p className="rounded-lg bg-emerald-50 text-emerald-700 text-sm px-3 py-2 border border-emerald-100">
          {message}
        </p>
      )}
      {error && (
        <p className="rounded-lg bg-red-50 text-red-700 text-sm px-3 py-2 border border-red-100">
          {error}
        </p>
      )}

      <div className="rounded-xl border border-line bg-panel p-5 shadow-sm max-w-2xl">
        {mode === "student" && (
          <form className="grid grid-cols-1 sm:grid-cols-2 gap-4" onSubmit={submitStudent}>
            <Field
              label="Name"
              value={studentForm.name}
              onChange={(v) => setStudentForm({ ...studentForm, name: v })}
              required
            />
            <Field
              label="Roll Number"
              value={studentForm.rollNumber}
              onChange={(v) => setStudentForm({ ...studentForm, rollNumber: v })}
              required
            />
            <Field
              label="Branch"
              value={studentForm.branch}
              onChange={(v) => setStudentForm({ ...studentForm, branch: v })}
              required
            />
            <Field
              label="CGPA"
              type="number"
              value={studentForm.cgpa}
              onChange={(v) => setStudentForm({ ...studentForm, cgpa: v })}
              required
            />
            <Field
              label="Backlogs"
              type="number"
              value={studentForm.backlogs}
              onChange={(v) => setStudentForm({ ...studentForm, backlogs: v })}
            />
            <Field
              label="Email"
              type="email"
              value={studentForm.email}
              onChange={(v) => setStudentForm({ ...studentForm, email: v })}
            />
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-ink">
                Resume PDF Upload
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  className="mt-1.5 block w-full text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-brand-700 hover:file:bg-brand-100"
                  onChange={handleResumeUpload}
                  disabled={uploading}
                />
              </label>
              <p className="mt-1 text-xs text-muted">
                {uploading
                  ? "Uploading PDF…"
                  : "Uploads to the server and fills the document link below."}
              </p>
            </div>
            <div className="sm:col-span-2">
              <Field
                label="Resume Document Link"
                value={studentForm.resumeLink}
                onChange={(v) => setStudentForm({ ...studentForm, resumeLink: v })}
              />
              {studentForm.resumeLink && (
                <a
                  href={studentForm.resumeLink}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-block text-xs font-semibold text-brand-700 hover:underline break-all"
                >
                  Open uploaded resume
                </a>
              )}
            </div>
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={saving || uploading}
                className="rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold px-4 py-2.5 text-sm disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save Student Profile"}
              </button>
            </div>
          </form>
        )}

        {mode === "job" && (
          <form className="grid grid-cols-1 sm:grid-cols-2 gap-4" onSubmit={submitJob}>
            <Field
              label="Company Name"
              value={jobForm.companyName}
              onChange={(v) => setJobForm({ ...jobForm, companyName: v })}
              required
            />
            <Field
              label="Role / Title"
              value={jobForm.title}
              onChange={(v) => setJobForm({ ...jobForm, title: v })}
              required
            />
            <Field
              label="Package (LPA)"
              type="number"
              value={jobForm.packageLpa}
              onChange={(v) => setJobForm({ ...jobForm, packageLpa: v })}
              required
            />
            <Field
              label="Min CGPA"
              type="number"
              value={jobForm.minCgpa}
              onChange={(v) => setJobForm({ ...jobForm, minCgpa: v })}
              required
            />
            <Field
              label="Max Allowed Backlogs"
              type="number"
              value={jobForm.maxBacklogs}
              onChange={(v) => setJobForm({ ...jobForm, maxBacklogs: v })}
            />
            <div className="sm:col-span-2">
              <Field
                label="Allowed Branches (comma-separated)"
                value={jobForm.allowedBranches}
                onChange={(v) => setJobForm({ ...jobForm, allowedBranches: v })}
              />
            </div>
            <Field
              label="Application Deadline"
              type="date"
              value={jobForm.deadline}
              onChange={(v) => setJobForm({ ...jobForm, deadline: v })}
            />
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold px-4 py-2.5 text-sm disabled:opacity-60"
              >
                {saving ? "Posting…" : "Post Job Drive"}
              </button>
            </div>
          </form>
        )}

        {mode === "application" && (
          <form className="grid grid-cols-1 gap-4" onSubmit={submitApplication}>
            <label className="block text-sm font-semibold text-ink">
              Student
              <select
                className="mt-1.5 w-full rounded-lg border border-line px-3 py-2.5 text-sm"
                value={appForm.studentId}
                onChange={(e) => setAppForm({ ...appForm, studentId: e.target.value })}
                required
              >
                <option value="">Select student</option>
                {students.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} ({s.rollNumber})
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-semibold text-ink">
              Job Drive
              <select
                className="mt-1.5 w-full rounded-lg border border-line px-3 py-2.5 text-sm"
                value={appForm.jobId}
                onChange={(e) => setAppForm({ ...appForm, jobId: e.target.value })}
                required
              >
                <option value="">Select job</option>
                {jobs.map((j) => (
                  <option key={j._id} value={j._id}>
                    {j.companyName} — {j.title}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold px-4 py-2.5 text-sm disabled:opacity-60 w-fit"
            >
              {saving ? "Creating…" : "Create Application"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", required }) {
  return (
    <label className="block text-sm font-semibold text-ink">
      {label}
      <input
        type={type}
        required={required}
        className="mt-1.5 w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
