const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema({
    title:       { type: String, required: true, trim: true },
    description: { type: String, required: true },
    techStack:   [{ type: String }],          // e.g. ["Node.js", "MongoDB"]
    liveUrl:     { type: String, default: "#" },
    githubUrl:   { type: String, default: "#" },
    thumbnail:   { type: String, default: "/images/default.png" },
    featured:    { type: Boolean, default: false },
    createdAt:   { type: Date, default: Date.now }
});

module.exports = mongoose.model("Project", projectSchema);