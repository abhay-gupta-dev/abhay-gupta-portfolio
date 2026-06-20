const express        = require("express");
const path           = require("path");
const expressLayouts = require("express-ejs-layouts");
require("dotenv").config();

const connectDB        = require("./db");
const Contact          = require("./models/Contact");
const Project          = require("./models/Project");
const Profile          = require("./models/Profile");
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

// ── Global Profile Middleware ──
app.use(async (req, res, next) => {
    try {
        const profile = await Profile.findOne();
        res.locals.profile = profile || { photoUrl: "", resumeUrl: "" };
    } catch (err) {
        res.locals.profile = { photoUrl: "", resumeUrl: "" };
    }
    next();
});

// ──────────────────────────────
//       ADMIN AUTH MIDDLEWARE
// ──────────────────────────────

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "yourpassword";

function adminAuth(req, res, next) {
    const auth = req.headers.authorization;

    if (!auth) {
        res.setHeader("WWW-Authenticate", 'Basic realm="Admin Area"');
        return res.status(401).send("Access denied");
    }

    const [, encoded] = auth.split(" ");
    const decoded = Buffer.from(encoded, "base64").toString();

    console.log("Decoded:", decoded);

    const [username, password] = decoded.split(":");

    console.log("Username:", username);
    console.log("Password entered:", password);
    console.log("Expected:", ADMIN_PASSWORD);

    if (password === ADMIN_PASSWORD) {
        return next();
    }

    res.setHeader("WWW-Authenticate", 'Basic realm="Admin Area"');
    return res.status(401).send("Wrong password");
}

// ──────────────────────────────
//         ADMIN ROUTES
// ──────────────────────────────

app.get("/admin", adminAuth, (req, res) => {
    res.render("admin/dashboard", { title: "Admin" });
});

// ── Upload Photo ──
app.post("/admin/upload/photo", adminAuth, upload.single("photo"), async (req, res) => {
    try {
        const result = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                {
                    folder:         "portfolio/images",
                    public_id:      `photo_${Date.now()}`,
                    transformation: [{ width: 800, height: 800, crop: "limit" }]
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );
            stream.end(req.file.buffer);
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
        console.error("❌ FULL ERROR:");
        console.dir(err, { depth: null });
        res.redirect("/admin");
    }
});


// ── Upload Resume ──
app.post("/admin/upload/resume", adminAuth, upload.single("resume"), async (req, res) => {
    try {
        console.log("FILE:", req.file);
        console.log("MIME:", req.file?.mimetype);

        if (!req.file) {
            return res.status(400).send("No file uploaded");
        }

        const result = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                {
                    folder:        "portfolio/resume",
                    public_id:     `resume_${Date.now()}`,
                    resource_type: "raw",
                    format:        "pdf"
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );
            stream.end(req.file.buffer);
        });

        console.log("✅ Resume URL:", result.secure_url);

        let profile = await Profile.findOne();
        if (!profile) profile = new Profile();

        if (profile.resumePublicId) {
            await cloudinary.uploader.destroy(profile.resumePublicId, {
                resource_type: "raw"
            });
        }

        profile.resumeUrl      = result.secure_url;
        profile.resumePublicId = result.public_id;
        profile.updatedAt      = Date.now();
        await profile.save();

        res.redirect("/admin");
    } catch (err) {
        console.error("❌ Resume upload error:", err);
        res.redirect("/admin");
    }
});


// ── Delete Resume (admin only) ──
app.post("/admin/resume/delete", adminAuth, async (req, res) => {
    try {
        const profile = await Profile.findOne();
        if (profile && profile.resumePublicId) {
            await cloudinary.uploader.destroy(profile.resumePublicId, {
                resource_type: "raw"
            });
            profile.resumeUrl      = "";
            profile.resumePublicId = "";
            await profile.save();
        }
        res.redirect("/about");
    } catch (err) {
        console.error("❌ Delete resume error:", err.message);
        res.redirect("/about");
    }
});

// ── Manage Projects ──
app.get("/admin/projects", adminAuth, async (req, res) => {
    try {
        const projects = await Project.find().sort({ createdAt: -1 });
        res.render("admin/projects", { title: "Manage Projects", projects });
    } catch (err) {
        console.error(err);
        res.render("admin/projects", { title: "Manage Projects", projects: [] });
    }
});

app.post(
    "/admin/projects/add",
    adminAuth,
    upload.single("thumbnail"),
    async (req, res) => {
        try {
            let imageUrl = "/images/default.png";

            if (req.file) {
                const result = await new Promise((resolve, reject) => {
                    const stream = cloudinary.uploader.upload_stream(
                        {
                            folder:    "portfolio/projects",
                            public_id: `project_${Date.now()}`
                        },
                        (error, result) => {
                            if (error) reject(error);
                            else resolve(result);
                        }
                    );
                    stream.end(req.file.buffer);
                });

                imageUrl = result.secure_url;
                console.log("✅ Project Image:", imageUrl);
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
            console.error("❌ Project Upload Error:", err);
            res.redirect("/admin/projects");
        }
    }
);

app.post("/admin/projects/delete/:id", adminAuth, async (req, res) => {
    try {
        await Project.findByIdAndDelete(req.params.id);
        res.redirect("/admin/projects");
    } catch (err) {
        console.error(err);
        res.redirect("/admin/projects");
    }
});

// ── Uploads page (admin only) ──
app.get("/uploads", adminAuth, (req, res) => {
    res.render("admin/dashboard", { title: "Uploads", success: false });
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
        console.error(err);
        res.render("listings/projects", { title: "Projects", projects: [] });
    }
});

app.get("/contact", (req, res) => {
    res.render("listings/contact", { title: "Contact Me", success: false });
});

app.post("/contact", async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;
        const newMessage = new Contact({ name, email, subject, message });
        await newMessage.save();
        await sendContactEmail({ name, email, subject, message });
        res.render("listings/contact", { title: "Contact Me", success: true });
    } catch (err) {
        console.error("Contact error:", err);
        res.render("listings/contact", { title: "Contact Me", success: false });
    }
});

// ── View Resume Page ──
app.get("/resume", async (req, res) => {
    try {
        const profile = await Profile.findOne();

        // Fix Cloudinary raw PDF URL so browser displays inline instead of downloading
        let resumeUrl = profile?.resumeUrl || "";
        if (resumeUrl && !resumeUrl.includes("fl_inline")) {
            resumeUrl = resumeUrl.replace("/raw/upload/", "/raw/upload/fl_inline/");
        }

        console.log("Resume URL:", resumeUrl);

        res.render("listings/resume", {
            title: "Resume",
            resumeUrl
        });
    } catch (err) {
        console.error("❌ Resume page error:", err);
        res.render("listings/resume", { title: "Resume", resumeUrl: "" });
    }
});
app.get("/test-cloudinary", async (req, res) => {
    try {
        const result = await cloudinary.api.ping();
        res.send("✅ Cloudinary connected: " + JSON.stringify(result));
    } catch (err) {
        res.send("❌ Cloudinary error: " + err.message);
    }
});

app.get("/check-env", (req, res) => {
    res.send({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key:    process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET ? "✅ loaded" : "❌ missing"
    });
});

// ── 404 ──
app.use((req, res) => {
    res.status(404).render("listings/404", { title: "Page Not Found" });
});

// ── Start ──
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});