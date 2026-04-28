const express = require("express");
const router = express.Router();
const transporter = require("../utils/mailer");

router.get("/test-mail", async (req, res) => {
    try {
        await transporter.sendMail({
            from: process.env.MAIL_FROM,
            to: "yourmail@gmail.com",
            subject: "SMTP Test",
            text: "Email working successfully"
        });

        res.send("Mail Sent");
    } catch (error) {
        res.status(500).send(error.message);
    }
});

module.exports = router;