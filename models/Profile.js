const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema({
    photoUrl:     { type: String, default: "" },
    photoPublicId:{ type: String, default: "" },
    resumeUrl:    { type: String, default: "" },
    resumePublicId:{ type: String, default: "" },
    updatedAt:    { type: Date, default: Date.now }
});

module.exports = mongoose.model("Profile", profileSchema);