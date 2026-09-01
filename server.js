require("dotenv").config();
const path = require("path");
const fs = require("fs");
const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const multer = require("multer");

const app = express();
const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_URI = process.env.MONGODB_URI;
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "placement-system-secret";
const UPLOAD_DIR = path.join(__dirname, "uploads");

if (!fs.existsSync("./uploads")) {
  fs.mkdirSync("./uploads", { recursive: true });
}
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const ROLES = {
  STUDENT: "STUDENT",
  COMPANY: "COMPANY",
  TPO: "TPO",
};

const APP_STATUSES = [
  "Applied",
  "Shortlisted",
  "Interview Scheduled",
  "Offered",
  "Rejected",
];

const TPO_UPDATE_STATUSES = [
  "Shortlisted",
  "Interview Scheduled",
  "Offered",
  "Rejected",
];

const users = [
  { id: 1, email: "student@college.edu", password: "student123", role: ROLES.STUDENT, name: "Aarav Sharma" },
  { id: 2, email: "hr@techcorp.com", password: "company123", role: ROLES.COMPANY, name: "TechCorp HR" },
  { id: 3, email: "tpo@college.edu", password: "tpo123", role: ROLES.TPO, name: "Placement Officer" },
];

/* ---------------- Schemas ---------------- */

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    role: { type: String, enum: [ROLES.TPO, ROLES.STUDENT, ROLES.COMPANY], required: true },
    branch: { type: String, trim: true, default: "" },
    rollNumber: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

const studentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    rollNumber: { type: String, required: true, unique: true, trim: true },
    branch: { type: String, required: true, trim: true },
    cgpa: { type: Number, required: true, min: 0, max: 10 },
    backlogs: { type: Number, required: true, min: 0, default: 0 },
    year: { type: String, trim: true, default: "4th Year" },
    skills: { type: [String], default: ["JavaScript", "React", "Node.js"] },
    phone: { type: String, trim: true, default: "" },
    email: { type: String, trim: true, default: "", lowercase: true },
    resumeLink: { type: String, trim: true, default: "" },
    resumeOriginalName: { type: String, trim: true, default: "" },
    placementStatus: {
      type: String,
      enum: ["Placed", "Eligible", "In Process"],
      default: "Eligible",
    },
  },
  { timestamps: true }
);

const jobSchema = new mongoose.Schema(
  {
    companyName: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    minCgpa: { type: Number, required: true, min: 0, max: 10 },
    maxBacklogs: { type: Number, required: true, min: 0, default: 0 },
    allowedBranches: { type: [String], default: [] },
    packageLpa: { type: Number, required: true, min: 0 },
    deadline: { type: Date, default: null },
    companyLogo: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

const applicationSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
    status: {
      type: String,
      enum: APP_STATUSES,
      default: "Applied",
    },
  },
  { timestamps: true }
);

applicationSchema.index({ studentId: 1, jobId: 1 }, { unique: true });

const User = mongoose.model("User", userSchema);
const Student = mongoose.model("Student", studentSchema);
const Job = mongoose.model("Job", jobSchema);
const Application = mongoose.model("Application", applicationSchema);

/* ---------------- Upload config ---------------- */

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const safe = (file.originalname || "resume.pdf").replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${Date.now()}-${safe}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limit
  fileFilter: (_req, file, cb) => {
    const originalName = (file.originalname || "").toLowerCase();
    const mimetype = (file.mimetype || "").toLowerCase();
    const isPdf =
      originalName.endsWith(".pdf") ||
      mimetype.includes("pdf") ||
      mimetype === "application/octet-stream" ||
      mimetype === "binary/octet-stream";
    if (!isPdf) {
      return cb(new Error("Only PDF files are allowed for resume upload"));
    }
    cb(null, true);
  },
});

/* ---------------- Auth helpers ---------------- */

function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid Authorization header" });
  }
  try {
    req.user = jwt.verify(header.slice(7), JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

function optionalAuthenticate(req, _res, next) {
  const header = req.headers.authorization;
  if (header && header.startsWith("Bearer ")) {
    try {
      req.user = jwt.verify(header.slice(7), JWT_SECRET);
    } catch {
      // allow through without failing
    }
  }
  next();
}

function authorize(...allowedRoles) {
  const normalizedAllowed = allowedRoles.map((r) => String(r).toUpperCase());
  return (req, res, next) => {
    const userRole = String(req.user?.role || "").toUpperCase();
    if (!req.user || !normalizedAllowed.includes(userRole)) {
      return res.status(403).json({ error: "Forbidden: insufficient role" });
    }
    next();
  };
}

function parseBranches(input) {
  if (Array.isArray(input)) return input.map((b) => String(b).trim()).filter(Boolean);
  if (typeof input === "string") {
    return input
      .split(",")
      .map((b) => b.trim())
      .filter(Boolean);
  }
  return [];
}

function publicUrl(req, relativePath) {
  const base = `${req.protocol}://${req.get("host")}`;
  return `${base}${relativePath}`;
}

async function syncStudentPlacementStatus(studentId) {
  const apps = await Application.find({ studentId });
  let status = "Eligible";
  if (apps.some((a) => a.status === "Offered")) status = "Placed";
  else if (apps.length > 0) status = "In Process";
  await Student.findByIdAndUpdate(studentId, { placementStatus: status });
  return status;
}

function eligibilityErrors(student, job) {
  const errors = [];
  if (Number(student.cgpa) < Number(job.minCgpa)) {
    errors.push(`CGPA ${student.cgpa} is below required minimum ${job.minCgpa}`);
  }
  const maxBacklogs = job.maxBacklogs ?? 0;
  if (Number(student.backlogs) > Number(maxBacklogs)) {
    errors.push(`Backlogs ${student.backlogs} exceed allowed maximum ${maxBacklogs}`);
  }
  if (job.allowedBranches?.length && !job.allowedBranches.includes(student.branch)) {
    errors.push(
      `Branch ${student.branch} is not in allowed branches (${job.allowedBranches.join(", ")})`
    );
  }
  return errors;
}

async function findStudentForUser(user, explicitStudentId) {
  if (explicitStudentId && mongoose.Types.ObjectId.isValid(explicitStudentId)) {
    return Student.findById(explicitStudentId);
  }
  if (user?.email) {
    return Student.findOne({ email: String(user.email).toLowerCase() });
  }
  return null;
}

/* ---------------- Auth ---------------- */

function signAuthToken(user) {
  return jwt.sign(
    {
      id: user._id ? String(user._id) : user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      branch: user.branch || "",
      rollNumber: user.rollNumber || "",
    },
    JWT_SECRET,
    { expiresIn: "8h" }
  );
}

function publicUser(user) {
  return {
    id: user._id ? String(user._id) : user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    branch: user.branch || "",
    rollNumber: user.rollNumber || "",
  };
}

app.post("/api/auth/register", async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      branch,
      rollNo,
      rollNumber,
    } = req.body || {};

    const normalizedRole = String(role || "").toUpperCase();
    const resolvedRoll = String(rollNo || rollNumber || "").trim();
    const normalizedEmail = email ? email.trim().toLowerCase() : "";

    console.log("[REGISTER] Incoming body:", {
      name,
      email: normalizedEmail,
      role: normalizedRole,
      branch,
      rollNo: resolvedRoll,
    });

    if (!name || !normalizedEmail || !password || !normalizedRole) {
      return res.status(400).json({
        error: "Name, email, password, and role are required",
      });
    }
    if (![ROLES.TPO, ROLES.STUDENT].includes(normalizedRole)) {
      return res.status(400).json({ error: "Role must be TPO or STUDENT" });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }
    if (normalizedRole === ROLES.STUDENT && (!branch || !resolvedRoll)) {
      return res.status(400).json({
        error: "Branch and roll number (rollNo) are required for students",
      });
    }

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ error: "An account with this email already exists" });
    }

    if (normalizedRole === ROLES.STUDENT) {
      const rollTaken = await User.findOne({
        role: ROLES.STUDENT,
        rollNumber: resolvedRoll,
      });
      if (rollTaken) {
        return res.status(409).json({ error: "Roll number already registered" });
      }
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      password: hashed,
      role: normalizedRole,
      branch: normalizedRole === ROLES.STUDENT ? String(branch).trim() : "",
      rollNumber: normalizedRole === ROLES.STUDENT ? resolvedRoll : "",
    });

    if (normalizedRole === ROLES.STUDENT) {
      await Student.findOneAndUpdate(
        { $or: [{ email: user.email }, { rollNumber: user.rollNumber }] },
        {
          $set: {
            name: user.name,
            email: user.email,
            rollNumber: user.rollNumber,
            branch: user.branch,
          },
          $setOnInsert: {
            cgpa: 7.0,
            backlogs: 0,
            placementStatus: "Eligible",
            resumeLink: "",
          },
        },
        { upsert: true, new: true }
      );
    }

    const token = signAuthToken(user);
    return res.status(201).json({
      token,
      user: publicUser(user),
    });
  } catch (err) {
    console.error("[REGISTER] Exact error:", err);
    console.error("[REGISTER] Message:", err?.message);
    console.error("[REGISTER] Stack:", err?.stack);
    if (err?.code === 11000) {
      return res.status(409).json({
        error: "Email or roll number already registered",
        details: err.keyValue || null,
      });
    }
    return res.status(500).json({
      error: err.message || "Registration failed",
    });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password, role } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const requestedRole = role ? String(role).toUpperCase() : null;

    let user = await User.findOne({ email: normalizedEmail });

    // Fallback to seeded demo accounts if not in MongoDB yet
    if (!user) {
      const demo = users.find(
        (u) =>
          u.email.trim().toLowerCase() === normalizedEmail &&
          u.password === password
      );
      if (!demo) return res.status(401).json({ error: "Invalid credentials" });
      if (requestedRole && demo.role !== requestedRole) {
        return res.status(403).json({ error: `This account is registered as ${demo.role}` });
      }
      const token = signAuthToken(demo);
      return res.json({ token, user: publicUser(demo) });
    }

    let match = false;
    if (
      user.password &&
      (user.password.startsWith("$2a$") ||
        user.password.startsWith("$2b$") ||
        user.password.startsWith("$2y$"))
    ) {
      match = await bcrypt.compare(password, user.password);
    } else {
      match = user.password === password;
    }

    if (!match) return res.status(401).json({ error: "Invalid credentials" });

    if (requestedRole && user.role !== requestedRole) {
      return res.status(403).json({ error: `This account is registered as ${user.role}` });
    }

    const token = signAuthToken(user);
    res.json({ token, user: publicUser(user) });
  } catch (err) {
    res.status(500).json({ error: err.message || "Login failed" });
  }
});

/* ---------------- Uploads ---------------- */

async function handleResumeUpload(req, res) {
  upload.any()(req, res, async (err) => {
    if (err) {
      console.error("[UPLOAD] Multer error:", err);
      return res.status(400).json({ success: false, error: err.message || "Upload failed" });
    }

    const file = req.file || (req.files && req.files[0]);
    if (!file) {
      return res.status(400).json({
        success: false,
        error: "PDF resume file is required. Please attach a PDF file.",
      });
    }

    const relativeUrl = `/uploads/${file.filename}`;
    const fullUrl = publicUrl(req, relativeUrl);

    // Auto-update student record if authenticated student
    if (req.user) {
      try {
        let student = await findStudentForUser(req.user);
        if (!student && req.user?.email) {
          student = await Student.create({
            name: req.user.name || "Student",
            email: String(req.user.email).toLowerCase(),
            rollNumber:
              req.user.rollNumber || `CS-${Math.floor(1000 + Math.random() * 9000)}`,
            branch: req.user.branch || "CSE",
            cgpa: 7.5,
            backlogs: 0,
            year: "4th Year",
            skills: ["JavaScript", "React", "Node.js"],
            resumeLink: fullUrl,
            resumeOriginalName: file.originalname,
            placementStatus: "Eligible",
          });
        } else if (student) {
          student.resumeLink = fullUrl;
          student.resumeOriginalName = file.originalname;
          await student.save();
        }
      } catch (dbErr) {
        console.error("[UPLOAD] Failed to auto-update student resume:", dbErr);
      }
    }

    return res.status(200).json({
      success: true,
      resumeUrl: relativeUrl,
      url: fullUrl,
      fullUrl,
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
    });
  });
}

app.post(
  "/api/student/resume",
  optionalAuthenticate,
  handleResumeUpload
);

app.post(
  "/api/users/resume",
  optionalAuthenticate,
  handleResumeUpload
);

app.post(
  "/api/students/resume",
  optionalAuthenticate,
  handleResumeUpload
);

app.post(
  "/api/uploads/resume",
  optionalAuthenticate,
  handleResumeUpload
);

/* ---------------- Analytics ---------------- */

app.get(
  "/api/analytics/overview",
  authenticate,
  authorize(ROLES.TPO, ROLES.COMPANY, ROLES.STUDENT),
  async (_req, res) => {
    try {
      const [totalStudents, activeDrives, placedCount, avgPackageAgg, students] =
        await Promise.all([
          Student.countDocuments(),
          Job.countDocuments(),
          Student.countDocuments({ placementStatus: "Placed" }),
          Job.aggregate([{ $group: { _id: null, avg: { $avg: "$packageLpa" } } }]),
          Student.find().select("branch placementStatus"),
        ]);

      const placementRate =
        totalStudents > 0 ? Number(((placedCount / totalStudents) * 100).toFixed(1)) : 0;
      const averagePackage = avgPackageAgg[0]?.avg
        ? Number(avgPackageAgg[0].avg.toFixed(2))
        : 0;

      const branchWise = {};
      for (const key of ["CSE", "IT", "ECE", "Mechanical"]) {
        branchWise[key] = { total: 0, placed: 0 };
      }

      for (const s of students) {
        let branch = s.branch || "Other";
        if (branch === "ME") branch = "Mechanical";
        if (!branchWise[branch]) continue;
        branchWise[branch].total += 1;
        if (s.placementStatus === "Placed") branchWise[branch].placed += 1;
      }

      res.json({
        totalStudents,
        activeDrives,
        placedCount,
        placementRate,
        averagePackage,
        branchWise,
      });
    } catch (err) {
      res.status(500).json({ error: err.message || "Failed to load analytics" });
    }
  }
);

/* ---------------- Students ---------------- */

app.get(
  "/api/students/me",
  authenticate,
  authorize(ROLES.STUDENT, ROLES.TPO),
  async (req, res) => {
    try {
      let student = await findStudentForUser(req.user);
      if (!student && req.user?.email) {
        // Auto-create initial profile for the student
        student = await Student.create({
          name: req.user.name || "Student",
          email: String(req.user.email).toLowerCase(),
          rollNumber:
            req.user.rollNumber || `CS-${Math.floor(1000 + Math.random() * 9000)}`,
          branch: req.user.branch || "CSE",
          cgpa: 7.5,
          backlogs: 0,
          year: "4th Year",
          skills: ["JavaScript", "React", "Node.js"],
          placementStatus: "Eligible",
          resumeLink: "",
        });
      }
      if (!student) {
        return res.status(404).json({
          error: "No student profile linked to this account.",
        });
      }
      res.json(student);
    } catch (err) {
      res.status(500).json({ error: err.message || "Failed to load profile" });
    }
  }
);

app.put(
  "/api/students/me",
  authenticate,
  authorize(ROLES.STUDENT, ROLES.TPO),
  async (req, res) => {
    try {
      const {
        name,
        rollNumber,
        branch,
        cgpa,
        backlogs,
        year,
        skills,
        resumeLink,
        resumeOriginalName,
        phone,
      } = req.body || {};

      let student = await findStudentForUser(req.user);

      const parseSkills = Array.isArray(skills)
        ? skills.map((s) => String(s).trim()).filter(Boolean)
        : typeof skills === "string"
          ? skills.split(",").map((s) => s.trim()).filter(Boolean)
          : undefined;

      if (!student) {
        student = await Student.create({
          name: name || req.user.name || "Student",
          email: String(req.user.email).toLowerCase(),
          rollNumber:
            rollNumber ||
            req.user.rollNumber ||
            `CS-${Math.floor(1000 + Math.random() * 9000)}`,
          branch: branch || req.user.branch || "CSE",
          cgpa: cgpa !== undefined && cgpa !== "" ? Number(cgpa) : 7.5,
          backlogs: backlogs !== undefined && backlogs !== "" ? Number(backlogs) : 0,
          year: year || "4th Year",
          skills: parseSkills || ["JavaScript", "React", "Node.js"],
          resumeLink: resumeLink || "",
          resumeOriginalName: resumeOriginalName || "",
          phone: phone || "",
          placementStatus: "Eligible",
        });
      } else {
        if (name !== undefined) student.name = String(name).trim();
        if (rollNumber !== undefined && rollNumber.trim())
          student.rollNumber = String(rollNumber).trim();
        if (branch !== undefined) student.branch = String(branch).trim();
        if (cgpa !== undefined && cgpa !== "") student.cgpa = Number(cgpa);
        if (backlogs !== undefined && backlogs !== "") student.backlogs = Number(backlogs);
        if (year !== undefined) student.year = String(year).trim();
        if (parseSkills !== undefined) student.skills = parseSkills;
        if (resumeLink !== undefined) student.resumeLink = String(resumeLink).trim();
        if (resumeOriginalName !== undefined)
          student.resumeOriginalName = String(resumeOriginalName).trim();
        if (phone !== undefined) student.phone = String(phone).trim();
        await student.save();
      }

      // Sync User record
      await User.findOneAndUpdate(
        { email: String(req.user.email).toLowerCase() },
        {
          $set: {
            ...(student.name ? { name: student.name } : {}),
            ...(student.branch ? { branch: student.branch } : {}),
            ...(student.rollNumber ? { rollNumber: student.rollNumber } : {}),
          },
        }
      );

      await syncStudentPlacementStatus(student._id);

      res.json(student);
    } catch (err) {
      res.status(400).json({ error: err.message || "Failed to update profile" });
    }
  }
);

app.post("/api/students", authenticate, authorize(ROLES.TPO), async (req, res) => {
  try {
    const { name, rollNumber, branch, cgpa, backlogs, email, resumeLink, placementStatus } =
      req.body || {};

    if (!name || !rollNumber || !branch || cgpa === undefined || cgpa === null) {
      return res.status(400).json({
        error: "name, rollNumber, branch, and cgpa are required",
      });
    }

    const student = await Student.create({
      name,
      rollNumber,
      branch,
      cgpa: Number(cgpa),
      backlogs: Number(backlogs) || 0,
      email: email || "",
      resumeLink: resumeLink || "",
      placementStatus: placementStatus || "Eligible",
    });

    res.status(201).json(student);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: "Student with this roll number already exists" });
    }
    res.status(400).json({ error: err.message || "Failed to create student" });
  }
});

app.get(
  "/api/students",
  authenticate,
  authorize(ROLES.TPO, ROLES.COMPANY, ROLES.STUDENT),
  async (req, res) => {
    try {
      const { branch, minCgpa, placementStatus, search } = req.query;
      const filter = {};

      if (branch) filter.branch = branch;
      if (minCgpa !== undefined && minCgpa !== "") {
        filter.cgpa = { $gte: Number(minCgpa) };
      }
      if (placementStatus) filter.placementStatus = placementStatus;
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: "i" } },
          { rollNumber: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ];
      }

      const students = await Student.find(filter).sort({ createdAt: -1 });
      res.json(students);
    } catch (err) {
      res.status(500).json({ error: err.message || "Failed to fetch students" });
    }
  }
);

app.get(
  "/api/students/:id",
  authenticate,
  authorize(ROLES.TPO, ROLES.COMPANY, ROLES.STUDENT),
  async (req, res) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ error: "Invalid student id" });
      }

      const student = await Student.findById(req.params.id);
      if (!student) return res.status(404).json({ error: "Student not found" });

      const applications = await Application.find({ studentId: student._id })
        .populate("jobId")
        .sort({ updatedAt: -1 });

      res.json({ student, applications });
    } catch (err) {
      res.status(500).json({ error: err.message || "Failed to fetch student details" });
    }
  }
);

/* ---------------- Jobs ---------------- */

app.post("/api/jobs", authenticate, authorize(ROLES.TPO, ROLES.COMPANY), async (req, res) => {
  try {
    const {
      companyName,
      title,
      minCgpa,
      maxBacklogs,
      allowedBranches,
      packageLpa,
      deadline,
      companyLogo,
    } = req.body || {};

    if (!companyName || !title || minCgpa === undefined || packageLpa === undefined) {
      return res.status(400).json({
        error: "companyName, title, minCgpa, and packageLpa are required",
      });
    }

    const job = await Job.create({
      companyName,
      title,
      minCgpa: Number(minCgpa),
      maxBacklogs: maxBacklogs === undefined || maxBacklogs === "" ? 0 : Number(maxBacklogs),
      allowedBranches: parseBranches(allowedBranches),
      packageLpa: Number(packageLpa),
      deadline: deadline ? new Date(deadline) : null,
      companyLogo: companyLogo || "",
    });

    res.status(201).json(job);
  } catch (err) {
    res.status(400).json({ error: err.message || "Failed to create job" });
  }
});

app.get(
  "/api/jobs",
  authenticate,
  authorize(ROLES.TPO, ROLES.COMPANY, ROLES.STUDENT),
  async (_req, res) => {
    try {
      const jobs = await Job.find().sort({ createdAt: -1 }).lean();
      const counts = await Application.aggregate([
        { $group: { _id: "$jobId", count: { $sum: 1 } } },
      ]);
      const countMap = Object.fromEntries(counts.map((c) => [String(c._id), c.count]));

      res.json(
        jobs.map((job) => ({
          ...job,
          applicantCount: countMap[String(job._id)] || 0,
        }))
      );
    } catch (err) {
      res.status(500).json({ error: err.message || "Failed to fetch jobs" });
    }
  }
);

app.get(
  "/api/jobs/:id/eligible-students",
  authenticate,
  authorize(ROLES.TPO, ROLES.COMPANY, ROLES.STUDENT),
  async (req, res) => {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: "Invalid job id" });
      }

      const job = await Job.findById(id);
      if (!job) return res.status(404).json({ error: "Job not found" });

      const filter = {
        cgpa: { $gte: job.minCgpa },
        backlogs: { $lte: job.maxBacklogs ?? 0 },
      };
      if (job.allowedBranches?.length) {
        filter.branch = { $in: job.allowedBranches };
      }

      const eligibleStudents = await Student.find(filter).sort({ cgpa: -1 });

      res.json({
        job: {
          id: job._id,
          title: job.title,
          companyName: job.companyName,
          minCgpa: job.minCgpa,
          maxBacklogs: job.maxBacklogs,
          allowedBranches: job.allowedBranches,
          packageLpa: job.packageLpa,
          deadline: job.deadline,
        },
        count: eligibleStudents.length,
        eligibleStudents,
      });
    } catch (err) {
      res.status(500).json({ error: err.message || "Failed to fetch eligible students" });
    }
  }
);

app.post(
  "/api/jobs/:id/apply",
  authenticate,
  authorize(ROLES.STUDENT, ROLES.TPO),
  async (req, res) => {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: "Invalid job id" });
      }

      const job = await Job.findById(id);
      if (!job) return res.status(404).json({ error: "Job not found" });

      if (job.deadline && new Date(job.deadline) < new Date()) {
        return res.status(400).json({ error: "Application deadline has passed" });
      }

      const student = await findStudentForUser(req.user, req.body?.studentId);
      if (!student) {
        return res.status(404).json({
          error:
            "Student profile not found. Add a student record with email matching your login.",
        });
      }

      if (
        req.user.role === ROLES.STUDENT &&
        student.email !== String(req.user.email).toLowerCase()
      ) {
        return res.status(403).json({ error: "You can only apply with your own student profile" });
      }

      const blockers = eligibilityErrors(student, job);
      if (blockers.length) {
        return res.status(403).json({
          error: `Not eligible to apply: ${blockers.join("; ")}`,
          reasons: blockers,
        });
      }

      const application = await Application.create({
        studentId: student._id,
        jobId: job._id,
        status: "Applied",
      });

      await syncStudentPlacementStatus(student._id);
      const populated = await Application.findById(application._id)
        .populate("studentId")
        .populate("jobId");

      res.status(201).json(populated);
    } catch (err) {
      if (err.code === 11000) {
        return res.status(409).json({ error: "You have already applied to this drive" });
      }
      res.status(400).json({ error: err.message || "Failed to apply" });
    }
  }
);

/* ---------------- Applications ---------------- */

app.get(
  "/api/applications",
  authenticate,
  authorize(ROLES.TPO, ROLES.COMPANY, ROLES.STUDENT),
  async (req, res) => {
    try {
      const filter = {};
      if (req.user.role === ROLES.STUDENT) {
        const student = await findStudentForUser(req.user);
        if (student) {
          filter.studentId = student._id;
        } else {
          return res.json([]);
        }
      }
      const applications = await Application.find(filter)
        .populate("studentId")
        .populate("jobId")
        .sort({ updatedAt: -1 });
      res.json(applications);
    } catch (err) {
      res.status(500).json({ error: err.message || "Failed to fetch applications" });
    }
  }
);

app.post(
  "/api/applications",
  authenticate,
  authorize(ROLES.TPO, ROLES.STUDENT),
  async (req, res) => {
    try {
      const { studentId, jobId, status } = req.body || {};
      if (!studentId || !jobId) {
        return res.status(400).json({ error: "studentId and jobId are required" });
      }

      const [student, job] = await Promise.all([
        Student.findById(studentId),
        Job.findById(jobId),
      ]);
      if (!student || !job) {
        return res.status(404).json({ error: "Student or job not found" });
      }

      const blockers = eligibilityErrors(student, job);
      if (blockers.length) {
        return res.status(403).json({
          error: `Not eligible: ${blockers.join("; ")}`,
          reasons: blockers,
        });
      }

      const application = await Application.create({
        studentId,
        jobId,
        status: APP_STATUSES.includes(status) ? status : "Applied",
      });

      await syncStudentPlacementStatus(studentId);
      const populated = await Application.findById(application._id)
        .populate("studentId")
        .populate("jobId");

      res.status(201).json(populated);
    } catch (err) {
      if (err.code === 11000) {
        return res.status(409).json({ error: "Application already exists for this student & job" });
      }
      res.status(400).json({ error: err.message || "Failed to create application" });
    }
  }
);

app.patch(
  "/api/applications/:id/status",
  authenticate,
  authorize(ROLES.TPO),
  async (req, res) => {
    try {
      const { status } = req.body || {};
      const allowed = ["Applied", ...TPO_UPDATE_STATUSES];
      if (!allowed.includes(status)) {
        return res.status(400).json({
          error: `status must be one of: ${allowed.join(", ")}`,
        });
      }

      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ error: "Invalid application id" });
      }

      const application = await Application.findByIdAndUpdate(
        req.params.id,
        { status },
        { new: true }
      )
        .populate("studentId")
        .populate("jobId");

      if (!application) return res.status(404).json({ error: "Application not found" });

      await syncStudentPlacementStatus(application.studentId._id || application.studentId);
      res.json(application);
    } catch (err) {
      res.status(400).json({ error: err.message || "Failed to update status" });
    }
  }
);

/* ---------------- Start ---------------- */

async function start() {
  try {
    if (!MONGODB_URI) {
      throw new Error("MONGODB_URI is missing in .env");
    }
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB Atlas");
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  }
}


start();

module.exports = { app, User, Student, Job, Application, APP_STATUSES };
