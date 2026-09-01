import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const hasToken = Boolean(localStorage.getItem("token"));

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("TPO");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (hasToken) {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login({ email: email.trim().toLowerCase(), password, role });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-full flex items-center justify-center px-4 py-10 bg-[radial-gradient(ellipse_at_top,_#d5efe7_0%,_#f1f5f9_45%,_#e2e8f0_100%)]">
      <div className="w-full max-w-md rounded-2xl border border-line bg-panel shadow-xl shadow-slate-200/60 p-8">
        <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-brand-600">
          Placement Portal
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl text-ink">
          Sign in
        </h1>
        <p className="mt-2 text-sm text-muted">
          Enter your credentials and select a role to continue.
        </p>

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 text-red-700 text-sm px-3 py-2 border border-red-100">
            {error}
          </p>
        )}

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm font-semibold text-ink">
            Email
            <input
              type="email"
              className="mt-1.5 w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="username"
            />
          </label>

          <label className="block text-sm font-semibold text-ink">
            Password
            <input
              type="password"
              className="mt-1.5 w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </label>

          <div>
            <p className="text-sm font-semibold text-ink mb-1.5">Role</p>
            <div className="grid grid-cols-2 gap-2 rounded-lg border border-line bg-slate-50 p-1">
              {["TPO", "STUDENT"].map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setRole(option)}
                  className={`rounded-md px-3 py-2 text-sm font-semibold transition ${
                    role === option
                      ? "bg-brand-600 text-white shadow-sm"
                      : "text-muted hover:text-ink"
                  }`}
                >
                  {option === "STUDENT" ? "Student" : "TPO"}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold py-2.5 text-sm disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-5 text-sm text-muted">
          New here?{" "}
          <Link to="/register" className="font-semibold text-brand-700 hover:underline">
            Create an account
          </Link>
        </p>
        <p className="mt-2 text-xs text-muted">
          Demo: tpo@college.edu / tpo123 · student@college.edu / student123
        </p>
      </div>
    </div>
  );
}
