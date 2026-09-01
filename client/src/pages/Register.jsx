import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const hasToken = Boolean(localStorage.getItem("token"));

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "STUDENT",
    branch: "CSE",
    rollNo: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (hasToken) {
    return <Navigate to="/dashboard" replace />;
  }

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        role: form.role,
        branch: form.role === "STUDENT" ? form.branch.trim() : undefined,
        rollNo: form.role === "STUDENT" ? form.rollNo.trim() : undefined,
        rollNumber: form.role === "STUDENT" ? form.rollNo.trim() : undefined,
      };

      await register(payload);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  const isStudent = form.role === "STUDENT";

  return (
    <div className="min-h-full flex items-center justify-center px-4 py-10 bg-[radial-gradient(ellipse_at_top,_#d5efe7_0%,_#f1f5f9_45%,_#e2e8f0_100%)]">
      <div className="w-full max-w-md rounded-2xl border border-line bg-panel shadow-xl shadow-slate-200/60 p-8">
        <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-brand-600">
          Placement Portal
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl text-ink">
          Create account
        </h1>
        <p className="mt-2 text-sm text-muted">
          Register as TPO or Student to access the dashboard.
        </p>

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 text-red-700 text-sm px-3 py-2 border border-red-100">
            {error}
          </p>
        )}

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm font-semibold text-ink">
            Name
            <input
              type="text"
              className="mt-1.5 w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              required
            />
          </label>

          <label className="block text-sm font-semibold text-ink">
            Email
            <input
              type="email"
              className="mt-1.5 w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              required
              autoComplete="username"
            />
          </label>

          <label className="block text-sm font-semibold text-ink">
            Password
            <input
              type="password"
              className="mt-1.5 w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
            />
          </label>

          <label className="block text-sm font-semibold text-ink">
            Role
            <select
              className="mt-1.5 w-full rounded-lg border border-line px-3 py-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
              value={form.role}
              onChange={(e) => update("role", e.target.value)}
            >
              <option value="TPO">TPO</option>
              <option value="STUDENT">Student</option>
            </select>
          </label>

          {isStudent && (
            <>
              <label className="block text-sm font-semibold text-ink">
                Branch
                <input
                  type="text"
                  className="mt-1.5 w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                  value={form.branch}
                  onChange={(e) => update("branch", e.target.value)}
                  required={isStudent}
                />
              </label>
              <label className="block text-sm font-semibold text-ink">
                Roll Number
                <input
                  type="text"
                  className="mt-1.5 w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                  value={form.rollNo}
                  onChange={(e) => update("rollNo", e.target.value)}
                  required={isStudent}
                />
              </label>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold py-2.5 text-sm disabled:opacity-60"
          >
            {loading ? "Creating account…" : "Register"}
          </button>
        </form>

        <p className="mt-5 text-sm text-muted">
          Already registered?{" "}
          <Link to="/login" className="font-semibold text-brand-700 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
