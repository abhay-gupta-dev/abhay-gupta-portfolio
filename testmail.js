require("dotenv").config();
const sendContactEmail = require("./utils/mailer");

sendContactEmail({
    name: "Test User",
    email: "test@gmail.com",
    subject: "Test Message",
    message: "This is a test message from portfolio."
}).then(() => {
    console.log("✅ Email sent successfully!");
}).catch((err) => {
    console.error("❌ Email failed:", err.message);
});