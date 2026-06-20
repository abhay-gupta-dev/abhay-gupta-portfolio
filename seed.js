require("dotenv").config();
const mongoose = require("mongoose");
const Project  = require("./models/Project");

const sampleProjects = [
    {
        title:       "Wanderlust",
        description: "A full-stack travel listing platform with maps, reviews, user authentication, and location-based search.",
        techStack:   ["Node.js", "Express.js", "MongoDB", "EJS", "Mapbox"],
        liveUrl:     "https://wanderlust-major-project-jzv9.onrender.com/",
        githubUrl:   "https://github.com/abhay-gupta-dev/WanderLust-major-project",
        thumbnail:   "/images/default.png",
        featured:    true
    }
];

mongoose.connect(process.env.MONGO_URI).then(async () => {
    await Project.deleteMany({});
    await Project.insertMany(sampleProjects);
    console.log("✅ Projects seeded successfully!");
    mongoose.connection.close();
}).catch(err => console.error(err));