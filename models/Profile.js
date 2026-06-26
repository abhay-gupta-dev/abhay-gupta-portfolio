const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema({
    photoUrl:          { type: String, default: "" },
    photoPublicId:     { type: String, default: "" },
    resumeUrl:         { type: String, default: "" },
    aboutText:         { type: String, default: "" },

    // Stats
    projectsCount:     { type: String, default: "5+" },
    dsaCount:          { type: String, default: "200+" },
    yearsCount:        { type: String, default: "2+" },

    // Tech Stack (comma separated)
    techStack:         { type: String, default: "Java,DSA,HTML,CSS,JavaScript,Node.js,Express.js,EJS,MongoDB,Git & GitHub" },

    updatedAt:         { type: Date, default: Date.now }
});

module.exports = mongoose.model("Profile", profileSchema);