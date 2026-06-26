const mongoose = require("mongoose");

const certificationSchema = new mongoose.Schema({
    title:     { type: String, required: true, trim: true },
    issuer:    { type: String, required: true, trim: true },
    date:      { type: String, required: true },
    imageUrl:  { type: String, default: "" },
    imagePublicId: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Certification", certificationSchema);