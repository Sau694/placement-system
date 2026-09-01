const API = "http://localhost:3000";

export function getToken() {
  return localStorage.getItem("token") || "";
}

export function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

async function request(path, { method = "GET", body, token, formData } = {}) {
  const headers = {};
  const auth = token ?? getToken();
  if (auth) headers.Authorization = `Bearer ${auth}`;

  let payload = undefined;
  if (formData) {
    payload = formData;
  } else if (body) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: payload,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || "Request failed");
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  login: ({ email, password, role }) =>
    request("/api/auth/login", {
      method: "POST",
      body: { email, password, role },
      token: "",
    }),
  register: (payload) =>
    request("/api/auth/register", {
      method: "POST",
      body: payload,
      token: "",
    }),
  overview: () => request("/api/analytics/overview"),
  students: (params = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== "" && v != null)
    ).toString();
    return request(`/api/students${qs ? `?${qs}` : ""}`);
  },
  studentDetails: (id) => request(`/api/students/${id}`),
  meStudent: () => request("/api/students/me"),
  updateMeStudent: (body) => request("/api/students/me", { method: "PUT", body }),
  createStudent: (body) => request("/api/students", { method: "POST", body }),
  jobs: () => request("/api/jobs"),
  createJob: (body) => request("/api/jobs", { method: "POST", body }),
  eligibleStudents: (jobId) => request(`/api/jobs/${jobId}/eligible-students`),
  applyToJob: (jobId, body = {}) =>
    request(`/api/jobs/${jobId}/apply`, { method: "POST", body }),
  applications: () => request("/api/applications"),
  createApplication: (body) => request("/api/applications", { method: "POST", body }),
  updateApplicationStatus: (id, status) =>
    request(`/api/applications/${id}/status`, { method: "PATCH", body: { status } }),
  uploadResume: (file) => {
    const formData = new FormData();
    formData.append("resume", file);
    return request("/api/student/resume", { method: "POST", formData });
  },
};

export { API };
