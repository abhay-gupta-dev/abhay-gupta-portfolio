const express        = require("express");
const path           = require("path");
const expressLayouts = require("express-ejs-layouts");
const session        = require("express-session");
require("dotenv").config();

const connectDB        = require("./db");
const Contact          = require("./models/Contact");
const Project          = require("./models/Project");
const Profile          = require("./models/Profile");
const Certification    = require("./models/Certification");
const sendContactEmail = require("./utils/mailer");
const { cloudinary, upload } = require("./utils/cloudinary");

const app  = express();
const PORT = process.env.PORT || 3000;

// ── DB ──
connectDB();

// ── EJS Setup ──
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(expressLayouts);
app.set("layout", "layouts/boilerplate");

// ── Middleware ──
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ── Session ──
app.use(session({
    secret:            process.env.SESSION_SECRET || "portfolio_secret_123",
    resave:            false,
    saveUninitialized: false,
    cookie:            { maxAge: 1000 * 60 * 60 * 24 }
}));

// ── Global Profile Middleware ──
app.use(async (req, res, next) => {
    try {
        const profile = await Profile.findOne();
        res.locals.profile = profile || { photoUrl: "", resumeUrl: "", aboutText: "" };
    } catch (err) {
        res.locals.profile = { photoUrl: "", resumeUrl: "", aboutText: "" };
    }
    next();
});

// ──────────────────────────────
//       ADMIN AUTH MIDDLEWARE
// ──────────────────────────────

function adminAuth(req, res, next) {
    if (req.session.isAdmin) return next();
    res.redirect("/admin/login");
}

// ── Admin Login GET ──
app.get("/admin/login", (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Admin Login</title>
            <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap" rel="stylesheet">
            <style>
                * { margin:0; padding:0; box-sizing:border-box; }
                body { background:#04041f; display:flex; align-items:center; justify-content:center; min-height:100vh; font-family:'Poppins',sans-serif; }
                .box { background:#081f38; border:1px solid rgba(124,58,237,0.3); border-radius:16px; padding:2.5rem; width:340px; }
                h2 { color:#f0f0ff; margin-bottom:0.25rem; font-size:1.3rem; }
                p { color:#8890aa; font-size:0.82rem; margin-bottom:1.5rem; }
                label { display:block; font-size:0.75rem; color:#a78bfa; text-transform:uppercase; letter-spacing:0.08em; margin-bottom:0.35rem; font-weight:600; }
                input { width:100%; padding:0.75rem 1rem; background:#04041f; border:1px solid rgba(124,58,237,0.3); border-radius:8px; color:#f0f0ff; font-size:0.9rem; font-family:'Poppins',sans-serif; margin-bottom:1rem; }
                input:focus { outline:none; border-color:#7c3aed; }
                button { width:100%; background:#7c3aed; color:#fff; border:none; padding:0.8rem; border-radius:8px; font-size:0.95rem; font-weight:600; cursor:pointer; font-family:'Poppins',sans-serif; }
                button:hover { opacity:0.88; }
            </style>
        </head>
        <body>
            <div class="box">
                <h2>🔐 Admin Login</h2>
                <p>Portfolio dashboard access</p>
                <form method="POST" action="/admin/login">
                    <label>Password</label>
                    <input type="password" name="password" placeholder="Enter admin password" required autofocus />
                    <button type="submit">Login</button>
                </form>
            </div>
        </body>
        </html>
    `);
});

// ── Admin Login POST ──
app.post("/admin/login", (req, res) => {
    const { password } = req.body;
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "yourpassword";
    if (password === ADMIN_PASSWORD) {
        req.session.isAdmin = true;
        res.redirect("/admin");
    } else {
        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Admin Login</title>
                <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap" rel="stylesheet">
                <style>
                    * { margin:0; padding:0; box-sizing:border-box; }
                    body { background:#04041f; display:flex; align-items:center; justify-content:center; min-height:100vh; font-family:'Poppins',sans-serif; }
                    .box { background:#081f38; border:1px solid rgba(124,58,237,0.3); border-radius:16px; padding:2.5rem; width:340px; }
                    h2 { color:#f0f0ff; margin-bottom:0.25rem; font-size:1.3rem; }
                    p { color:#8890aa; font-size:0.82rem; margin-bottom:1.5rem; }
                    label { display:block; font-size:0.75rem; color:#a78bfa; text-transform:uppercase; letter-spacing:0.08em; margin-bottom:0.35rem; font-weight:600; }
                    input { width:100%; padding:0.75rem 1rem; background:#04041f; border:1px solid rgba(124,58,237,0.3); border-radius:8px; color:#f0f0ff; font-size:0.9rem; font-family:'Poppins',sans-serif; margin-bottom:1rem; }
                    input:focus { outline:none; border-color:#7c3aed; }
                    button { width:100%; background:#7c3aed; color:#fff; border:none; padding:0.8rem; border-radius:8px; font-size:0.95rem; font-weight:600; cursor:pointer; font-family:'Poppins',sans-serif; }
                    .err { color:#f87171; font-size:0.82rem; margin-bottom:1rem; background:rgba(220,38,38,0.1); border:1px solid rgba(220,38,38,0.2); padding:0.5rem 0.75rem; border-radius:6px; }
                </style>
            </head>
            <body>
                <div class="box">
                    <h2>🔐 Admin Login</h2>
                    <p>Portfolio dashboard access</p>
                    <div class="err">❌ Wrong password. Try again.</div>
                    <form method="POST" action="/admin/login">
                        <label>Password</label>
                        <input type="password" name="password" placeholder="Enter admin password" required autofocus />
                        <button type="submit">Login</button>
                    </form>
                </div>
            </body>
            </html>
        `);
    }
});

// ── Admin Logout ──
app.get("/admin/logout", (req, res) => {
    req.session.destroy();
    res.redirect("/admin/login");
});

// ──────────────────────────────
//         ADMIN ROUTES
// ──────────────────────────────

app.get("/admin", adminAuth, async (req, res) => {
    try {
        const certifications = await Certification.find().sort({ createdAt: -1 });
        res.render("admin/dashboard", { title: "Admin", certifications });
    } catch (err) {
        res.render("admin/dashboard", { title: "Admin", certifications: [] });
    }
});

// ── Upload Photo ──
app.post("/admin/upload/photo", adminAuth, upload.single("photo"), async (req, res) => {
    try {
        if (!req.file) return res.redirect("/admin");

        const result = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
                {
                    folder:         "portfolio/images",
                    public_id:      `photo_${Date.now()}`,
                    transformation: [{ width: 800, height: 800, crop: "limit" }]
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            ).end(req.file.buffer);
        });

        console.log("✅ Photo URL:", result.secure_url);

        let profile = await Profile.findOne();
        if (!profile) profile = new Profile();

        if (profile.photoPublicId) {
            await cloudinary.uploader.destroy(profile.photoPublicId);
        }

        profile.photoUrl      = result.secure_url;
        profile.photoPublicId = result.public_id;
        profile.updatedAt     = Date.now();
        await profile.save();

        res.redirect("/admin");
    } catch (err) {
        console.error("❌ Photo upload error:", err.message);
        res.redirect("/admin");
    }
});

// ── Save Resume Link ──
app.post("/admin/upload/resume-link", adminAuth, async (req, res) => {
    try {
        let { resumeUrl } = req.body;

        if (resumeUrl.includes("drive.google.com/file/d/")) {
            const fileId = resumeUrl.match(/\/d\/([a-zA-Z0-9_-]+)/)?.[1];
            if (fileId) {
                resumeUrl = `https://drive.google.com/file/d/${fileId}/preview`;
            }
        }

        let profile = await Profile.findOne();
        if (!profile) profile = new Profile();

        profile.resumeUrl = resumeUrl;
        profile.updatedAt = Date.now();
        await profile.save();

        console.log("✅ Resume URL saved:", resumeUrl);
        res.redirect("/admin");
    } catch (err) {
        console.error("❌ Resume link error:", err.message);
        res.redirect("/admin");
    }
});

// ── Edit About — SINGLE ROUTE (saves all fields) ──
app.post("/admin/about/update", adminAuth, async (req, res) => {
    try {
        console.log("BODY:", req.body);

        const {
            aboutText,
            projectsCount,
            dsaCount,
            yearsCount,
            techStack
        } = req.body;

        let profile = await Profile.findOne();
        if (!profile) profile = new Profile();

        profile.aboutText     = aboutText;
        profile.projectsCount = projectsCount;
        profile.dsaCount      = dsaCount;
        profile.yearsCount    = yearsCount;
        profile.techStack     = techStack;
        profile.updatedAt     = Date.now();
        await profile.save();

        console.log("✅ About saved:", profile.projectsCount, profile.dsaCount, profile.techStack);
        res.redirect("/admin");
    } catch (err) {
        console.error("❌ About update error:", err.message);
        res.redirect("/admin");
    }
});

// ── Add Certification ──
app.post("/admin/certifications/add", adminAuth, upload.single("certImage"), async (req, res) => {
    try {
        const { title, issuer, date } = req.body;
        let imageUrl = "";
        let imagePublicId = "";

        if (req.file) {
            const result = await new Promise((resolve, reject) => {
                cloudinary.uploader.upload_stream(
                    { folder: "portfolio/certifications", public_id: `cert_${Date.now()}` },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    }
                ).end(req.file.buffer);
            });
            imageUrl      = result.secure_url;
            imagePublicId = result.public_id;
            console.log("✅ Cert image:", imageUrl);
        }

        const cert = new Certification({ title, issuer, date, imageUrl, imagePublicId });
        await cert.save();
        res.redirect("/admin");
    } catch (err) {
        console.error("❌ Certification add error:", err.message);
        res.redirect("/admin");
    }
});

// ── Delete Certification ──
app.post("/admin/certifications/delete/:id", adminAuth, async (req, res) => {
    try {
        const cert = await Certification.findById(req.params.id);
        if (cert && cert.imagePublicId) {
            await cloudinary.uploader.destroy(cert.imagePublicId);
        }
        await Certification.findByIdAndDelete(req.params.id);
        res.redirect("/admin");
    } catch (err) {
        console.error("❌ Certification delete error:", err.message);
        res.redirect("/admin");
    }
});

// ── Manage Projects ──
app.get("/admin/projects", adminAuth, async (req, res) => {
    try {
        const projects = await Project.find().sort({ createdAt: -1 });
        res.render("admin/projects", { title: "Manage Projects", projects });
    } catch (err) {
        res.render("admin/projects", { title: "Manage Projects", projects: [] });
    }
});

app.post("/admin/projects/add", adminAuth, upload.single("thumbnail"), async (req, res) => {
    try {
        let imageUrl = "/images/default.png";

        if (req.file) {
            const result = await new Promise((resolve, reject) => {
                cloudinary.uploader.upload_stream(
                    { folder: "portfolio/projects", public_id: `project_${Date.now()}` },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    }
                ).end(req.file.buffer);
            });
            imageUrl = result.secure_url;
        }

        const { title, description, techStack, liveUrl, githubUrl, featured } = req.body;
        const newProject = new Project({
            title,
            description,
            techStack: techStack.split(",").map(t => t.trim()),
            liveUrl:   liveUrl   || "#",
            githubUrl: githubUrl || "#",
            thumbnail: imageUrl,
            featured:  featured === "on"
        });
        await newProject.save();
        res.redirect("/admin/projects");
    } catch (err) {
        console.error("❌ Project upload error:", err.message);
        res.redirect("/admin/projects");
    }
});

app.post("/admin/projects/delete/:id", adminAuth, async (req, res) => {
    try {
        await Project.findByIdAndDelete(req.params.id);
        res.redirect("/admin/projects");
    } catch (err) {
        console.error(err);
        res.redirect("/admin/projects");
    }
});

// ──────────────────────────────
//         PUBLIC ROUTES
// ──────────────────────────────

app.get("/", async (req, res) => {
    try {
        const projects = await Project.find({ featured: true }).limit(3);
        res.render("listings/index", { title: "Home", projects });
    } catch (err) {
        res.render("listings/index", { title: "Home", projects: [] });
    }
});

app.get("/about", (req, res) => {
    res.render("listings/about", { title: "About Me" });
});

app.get("/services", (req, res) => {
    res.render("listings/services", { title: "Services" });
});

app.get("/projects", async (req, res) => {
    try {
        const projects = await Project.find().sort({ createdAt: -1 });
        res.render("listings/projects", { title: "Projects", projects });
    } catch (err) {
        res.render("listings/projects", { title: "Projects", projects: [] });
    }
});

app.get("/certifications", async (req, res) => {
    try {
        const certifications = await Certification.find().sort({ createdAt: -1 });
        res.render("listings/certifications", { title: "Certifications", certifications });
    } catch (err) {
        res.render("listings/certifications", { title: "Certifications", certifications: [] });
    }
});

app.get("/contact", (req, res) => {
    res.render("listings/contact", { title: "Contact Me", success: false });
});

app.post("/contact", async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;
        
        // 1. Save message to MongoDB
        const newMessage = new Contact({ name, email, subject, message });
        await newMessage.save();
        
        // 2. Trigger the Resend email function
        await sendContactEmail({ name, email, subject, message });
        
        // 3. Render success state back to your EJS view
        res.render("listings/contact", { title: "Contact Me", success: true });
    } catch (err) {
        // Detailed logging to catch any Resend API or Database issues on Render
        console.error("❌ CONTACT FORM ERROR:", err.message || err);
        
        res.render("listings/contact", { 
            title: "Contact Me", 
            success: false, 
            error: "Something went wrong. Please try again later." 
        });
    }
});

app.get("/resume", async (req, res) => {
    try {
        const profile = await Profile.findOne();
        const resumeUrl = profile?.resumeUrl || "";
        res.render("listings/resume", { title: "Resume", resumeUrl });
    } catch (err) {
        res.render("listings/resume", { title: "Resume", resumeUrl: "" });
    }
});

// ── 404 ──
app.use((req, res) => {
    res.status(404).render("listings/404", { title: "Page Not Found" });
});

// ── Start ──
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});