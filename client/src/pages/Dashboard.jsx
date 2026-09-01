import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth/AuthContext";
import Shell from "../components/Shell";
import Overview from "../components/tabs/Overview";
import StudentsDirectory from "../components/tabs/StudentsDirectory";
import JobsDrives from "../components/tabs/JobsDrives";
import ApplicationsTracker from "../components/tabs/ApplicationsTracker";
import AddRecords from "../components/tabs/AddRecords";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Student default tab is 'jobs', TPO / Company default tab is 'overview'
  const isStudent = String(user?.role || "").toUpperCase() === "STUDENT";
  const [activeTab, setActiveTab] = useState(() =>
    String(user?.role || "").toUpperCase() === "STUDENT" ? "jobs" : "overview"
  );

  const [overview, setOverview] = useState(null);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const bump = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    if (isStudent && ["overview", "students", "records"].includes(activeTab)) {
      setActiveTab("jobs");
    }
  }, [isStudent, activeTab]);

  const loadOverview = useCallback(async () => {
    // If student, do not fetch analytics overview
    if (isStudent) return;

    try {
      const data = await api.overview();
      setOverview(data);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }, [isStudent]);

  useEffect(() => {
    loadOverview();
  }, [refreshKey, loadOverview]);

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <Shell
      user={user}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onLogout={handleLogout}
    >
      {/* Error Message */}
      {error && activeTab === "overview" && (
        <p className="mb-4 rounded-lg bg-red-50 text-red-700 text-sm px-3 py-2">
          {error}
        </p>
      )}

      {/* TPO ONLY VIEW */}
      {!isStudent && activeTab === "overview" && (
        <Overview data={overview} loading={!overview} />
      )}

      {!isStudent && activeTab === "students" && (
        <StudentsDirectory refreshKey={refreshKey} />
      )}

      {!isStudent && activeTab === "records" && (
        <AddRecords onCreated={bump} />
      )}

      {/* COMMON / STUDENT VIEWS */}
      {activeTab === "jobs" && (
        <JobsDrives refreshKey={refreshKey} onChanged={bump} />
      )}

      {activeTab === "applications" && (
        <ApplicationsTracker refreshKey={refreshKey} onChanged={bump} />
      )}
    </Shell>
  );
}