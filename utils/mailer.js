const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const sendContactEmail = async ({ name, email, subject, message }) => {
    try {
        const data = await resend.emails.send({
            from: 'Portfolio Contact <onboarding@resend.dev>',
            to: process.env.EMAIL_USER,
            replyTo: email,
            subject: `📬 New Message: ${subject || "No Subject"} — from ${name}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 2rem; border-radius: 10px;">
                    <h2 style="color: #7c3aed;">📬 New Portfolio Message</h2>

                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td><b>Name:</b></td>
                            <td>${name}</td>
                        </tr>
                        <tr>
                            <td><b>Email:</b></td>
                            <td>${email}</td>
                        </tr>
                        <tr>
                            <td><b>Subject:</b></td>
                            <td>${subject || "—"}</td>
                        </tr>
                    </table>

                    <hr />

                    <h3>Message</h3>
                    <p style="background:#fff; padding:10px; border-left:4px solid #7c3aed;">
                        ${message}
                    </p>

                    <p style="font-size:12px; color:#888;">
                        Sent from your portfolio contact form
                    </p>
                </div>
            `
        });

        return data;

    } catch (error) {
        console.error("Email error:", error.message);
        return null;
    }
};

module.exports = sendContactEmail;