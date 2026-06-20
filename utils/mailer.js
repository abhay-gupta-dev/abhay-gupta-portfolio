const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const sendContactEmail = async ({ name, email, subject, message }) => {
    const mailOptions = {
        from: `"Portfolio Contact" <${process.env.EMAIL_USER}>`,
        to:   process.env.EMAIL_USER,   // sends to yourself
        replyTo: email,                 // so you can reply directly to the sender
        subject: `📬 New Message: ${subject || "No Subject"} — from ${name}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 2rem; border-radius: 10px;">
                <h2 style="color: #7c3aed; margin-bottom: 1rem;">📬 New Portfolio Message</h2>

                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 8px 0; color: #555; font-weight: bold; width: 100px;">Name</td>
                        <td style="padding: 8px 0; color: #222;">${name}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #555; font-weight: bold;">Email</td>
                        <td style="padding: 8px 0;">
                            <a href="mailto:${email}" style="color: #7c3aed;">${email}</a>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #555; font-weight: bold;">Subject</td>
                        <td style="padding: 8px 0; color: #222;">${subject || "—"}</td>
                    </tr>
                </table>

                <hr style="margin: 1.5rem 0; border: none; border-top: 1px solid #ddd;" />

                <h3 style="color: #555; margin-bottom: 0.5rem;">Message</h3>
                <p style="color: #222; line-height: 1.7; background: #fff; padding: 1rem; border-radius: 8px; border-left: 4px solid #7c3aed;">
                    ${message}
                </p>

                <p style="margin-top: 1.5rem; font-size: 0.8rem; color: #aaa;">
                    Sent from your portfolio contact form • Hit reply to respond directly to ${name}
                </p>
            </div>
        `
    };

    await transporter.sendMail(mailOptions);
};

module.exports = sendContactEmail;