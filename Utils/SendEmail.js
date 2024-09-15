const { createTransport } = require("nodemailer");

const sendEmail = async (to, subject, text) => {
    if (!to) {
        throw new Error("Recipient email address is missing");
    }

    try {
        const transporter = createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        await transporter.sendMail({
            from: process.env.MY_EMAIL,  // sender address
            to,
            subject,
            text,
        });
    } catch (error) {
        console.error("Error while sending email:", error);
        throw new Error("Failed to send email");
    }
};

module.exports = sendEmail;
