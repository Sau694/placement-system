const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const students = [
  { id: 1, name: "Aarav Sharma", email: "aarav@example.com", cgpa: 8.5, branch: "CSE" },
  { id: 2, name: "Diya Patel", email: "diya@example.com", cgpa: 7.2, branch: "ECE" },
  { id: 3, name: "Rohan Mehta", email: "rohan@example.com", cgpa: 9.1, branch: "CSE" },
  { id: 4, name: "Isha Verma", email: "isha@example.com", cgpa: 6.8, branch: "IT" },
  { id: 5, name: "Kabir Singh", email: "kabir@example.com", cgpa: 8.0, branch: "ME" },
];

const jobs = [
  { id: 1, title: "Software Engineer", company: "TechCorp", minCgpa: 7.5, location: "Bangalore" },
  { id: 2, title: "Data Analyst", company: "DataWorks", minCgpa: 7.0, location: "Hyderabad" },
  { id: 3, title: "Backend Developer", company: "CloudNine", minCgpa: 8.0, location: "Pune" },
];

// GET /api/jobs/:id/eligible-students — students whose CGPA meets the job's minimum
app.get("/api/jobs/:id/eligible-students", (req, res) => {
  const jobId = Number(req.params.id);
  const job = jobs.find((j) => j.id === jobId);

  if (!job) {
    return res.status(404).json({ error: "Job not found" });
  }

  const eligibleStudents = students.filter((student) => student.cgpa >= job.minCgpa);

  res.json({
    job: {
      id: job.id,
      title: job.title,
      company: job.company,
      minCgpa: job.minCgpa,
    },
    count: eligibleStudents.length,
    eligibleStudents,
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
