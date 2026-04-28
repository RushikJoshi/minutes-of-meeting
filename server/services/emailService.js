const nodemailer = require("nodemailer");

class EmailService {
  constructor() {
    this._transporter = null;
  }

  getEnv(name, fallbackName = "") {
    return process.env[name] || (fallbackName ? process.env[fallbackName] : "");
  }

  getTransporter() {
    if (!this._transporter) {
      const host = this.getEnv("EMAIL_HOST", "SMTP_HOST");
      const service = this.getEnv("EMAIL_SERVICE");
      const user = this.getEnv("EMAIL_USER", "SMTP_USER");
      const pass = this.getEnv("EMAIL_PASS", "SMTP_PASS");
      const port = parseInt(this.getEnv("EMAIL_PORT", "SMTP_PORT") || "587", 10);
      const secure = this.getEnv("EMAIL_SECURE", "SMTP_SECURE") === "true";

      if (service) {
        this._transporter = nodemailer.createTransport({
          service,
          auth: {
            user,
            pass,
          },
        });
      } else if (host) {
        this._transporter = nodemailer.createTransport({
          host,
          port,
          secure,
          auth: {
            user,
            pass,
          },
        });
      }
    }
    return this._transporter;
  }

  isConfigured() {
    return !!(
      this.getEnv("EMAIL_USER", "SMTP_USER") &&
      this.getEnv("EMAIL_PASS", "SMTP_PASS") &&
      (this.getEnv("EMAIL_SERVICE") || this.getEnv("EMAIL_HOST", "SMTP_HOST"))
    );
  }

  formatDate(date, timezone) {
    if (!date) return "To be announced";
    return new Intl.DateTimeFormat("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: timezone || "Asia/Kolkata",
    }).format(new Date(date));
  }

  escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  buildInviteHtml({ meeting, recipientName, joinLink, meetLink }) {
    const safeTitle = this.escapeHtml(meeting.title || "Meeting Invitation");
    const safeAgenda = this.escapeHtml(meeting.agenda || meeting.description || "Agenda will be shared shortly.");
    const safeDate = this.escapeHtml(this.formatDate(meeting.date, meeting.timezone));
    const safeTime = this.escapeHtml(
      `${meeting.startTime || "TBD"} - ${meeting.endTime || "TBD"} (${meeting.timezone || "Asia/Kolkata"})`
    );
    const safeLocation = this.escapeHtml(
      meeting.type === "offline" ? meeting.location || "Location will be shared soon" : meeting.platform || "Online"
    );
    const greeting = this.escapeHtml(recipientName || "there");

    return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Meeting Invitation</title>
  </head>
  <body style="margin:0;padding:24px;background:#f8fafc;font-family:Segoe UI,Arial,sans-serif;color:#0f172a;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:680px;margin:0 auto;background:#ffffff;border-radius:24px;overflow:hidden;border:1px solid #e2e8f0;">
      <tr>
        <td style="padding:36px 40px;background:linear-gradient(135deg,#0f172a,#1d4ed8);">
          <div style="display:inline-block;padding:8px 14px;border-radius:999px;background:rgba(255,255,255,0.14);color:#dbeafe;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">
            MOM Meeting Invite
          </div>
          <h1 style="margin:18px 0 10px;font-size:30px;line-height:1.2;color:#ffffff;">${safeTitle}</h1>
          <p style="margin:0;color:#bfdbfe;font-size:15px;line-height:1.7;">
            Hello ${greeting}, you have been invited to join a meeting on MOM. Your personal invite link is ready below.
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding:32px 40px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;border-spacing:0 12px;">
            <tr>
              <td style="padding:16px 18px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:16px;">
                <div style="font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#64748b;">Date</div>
                <div style="margin-top:6px;font-size:15px;font-weight:600;color:#0f172a;">${safeDate}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 18px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:16px;">
                <div style="font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#64748b;">Time</div>
                <div style="margin-top:6px;font-size:15px;font-weight:600;color:#0f172a;">${safeTime}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 18px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:16px;">
                <div style="font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#64748b;">Location</div>
                <div style="margin-top:6px;font-size:15px;font-weight:600;color:#0f172a;">${safeLocation}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 18px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:16px;">
                <div style="font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#64748b;">Agenda</div>
                <div style="margin-top:6px;font-size:14px;line-height:1.7;color:#334155;">${safeAgenda}</div>
              </td>
            </tr>
          </table>

          <div style="margin-top:28px;">
            <a href="${joinLink}" style="display:inline-block;padding:14px 24px;border-radius:14px;background:#1d4ed8;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;">
              Accept Invite
            </a>
            ${
              meetLink
                ? `<a href="${meetLink}" style="display:inline-block;margin-left:12px;padding:14px 24px;border-radius:14px;background:#eff6ff;color:#1d4ed8;text-decoration:none;font-size:15px;font-weight:700;border:1px solid #bfdbfe;">Open Meeting Link</a>`
                : ""
            }
          </div>

          <p style="margin:24px 0 0;font-size:13px;line-height:1.7;color:#64748b;">
            If the primary button does not work, copy this secure invite link into your browser:
          </p>
          <p style="margin:8px 0 0;font-size:13px;line-height:1.7;word-break:break-all;color:#1d4ed8;">
            ${this.escapeHtml(joinLink)}
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding:20px 40px;background:#f8fafc;border-top:1px solid #e2e8f0;color:#64748b;font-size:12px;line-height:1.7;">
          This invitation was sent from MOM. A calendar invite is attached for easy scheduling.
        </td>
      </tr>
    </table>
  </body>
</html>`;
  }

  buildIcsContent(meeting) {
    const uid = `${meeting._id}@momsystem`;
    const now = new Date().toISOString().replace(/[-:.]/g, "").slice(0, 15) + "Z";
    const start = meeting.date ? new Date(meeting.date) : new Date();
    const end = new Date(start);

    if (meeting.startTime) {
      const [startHour, startMinute] = String(meeting.startTime).split(":").map(Number);
      start.setHours(startHour || 0, startMinute || 0, 0, 0);
    }

    if (meeting.endTime) {
      const [endHour, endMinute] = String(meeting.endTime).split(":").map(Number);
      end.setHours(endHour || 0, endMinute || 0, 0, 0);
    } else {
      end.setHours(start.getHours() + 1, start.getMinutes(), 0, 0);
    }

    const dtStart = start.toISOString().replace(/[-:.]/g, "").slice(0, 15) + "Z";
    const dtEnd = end.toISOString().replace(/[-:.]/g, "").slice(0, 15) + "Z";

    return [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//MOM System//EN",
      "METHOD:REQUEST",
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTAMP:${now}`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `SUMMARY:${meeting.title || "Meeting"}`,
      `DESCRIPTION:${(meeting.agenda || meeting.description || "").replace(/\n/g, "\\n")}`,
      `LOCATION:${meeting.location || meeting.meetingLink || "Online"}`,
      "STATUS:CONFIRMED",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
  }

  buildReminderHtml({ meeting, minutesBefore }) {
    const safeTitle = this.escapeHtml(meeting.title || "Upcoming meeting");
    const safeAgenda = this.escapeHtml(meeting.agenda || "Agenda will be shared shortly.");
    const safeDate = this.escapeHtml(this.formatDate(meeting.date, meeting.timezone));
    const safeTime = this.escapeHtml(
      `${meeting.startTime || "TBD"} - ${meeting.endTime || "TBD"} (${meeting.timezone || "Asia/Kolkata"})`
    );
    const safeMinutes = this.escapeHtml(String(minutesBefore || 0));
    const safeLocation = this.escapeHtml(meeting.location || meeting.meetingLink || meeting.link || "Online");

    return `
      <div style="font-family:Segoe UI,Arial,sans-serif;background:#f8fafc;padding:24px;color:#0f172a;">
        <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:20px;overflow:hidden;">
          <div style="padding:28px 32px;background:linear-gradient(135deg,#0f172a,#1d4ed8);color:#fff;">
            <div style="font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#bfdbfe;">Meeting Reminder</div>
            <h1 style="margin:12px 0 6px;font-size:28px;">${safeTitle}</h1>
            <p style="margin:0;color:#dbeafe;">This meeting starts in ${safeMinutes} minute(s).</p>
          </div>
          <div style="padding:28px 32px;">
            <p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#334155;">Please review the agenda and be ready to join on time.</p>
            <div style="padding:16px;border-radius:16px;background:#f8fafc;border:1px solid #e2e8f0;margin-bottom:12px;"><strong>Date:</strong> ${safeDate}</div>
            <div style="padding:16px;border-radius:16px;background:#f8fafc;border:1px solid #e2e8f0;margin-bottom:12px;"><strong>Time:</strong> ${safeTime}</div>
            <div style="padding:16px;border-radius:16px;background:#f8fafc;border:1px solid #e2e8f0;margin-bottom:12px;"><strong>Location:</strong> ${safeLocation}</div>
            <div style="padding:16px;border-radius:16px;background:#f8fafc;border:1px solid #e2e8f0;"><strong>Agenda:</strong><br />${safeAgenda}</div>
          </div>
        </div>
      </div>
    `;
  }

  async sendMeetingInvitation({ meeting, recipients }) {
    if (!this.isConfigured()) {
      console.warn("Email not configured (EMAIL_USER / EMAIL_PASS missing). Skipping invitations.");
      return { sent: 0, failed: recipients.map((recipient) => ({ email: recipient.email, reason: "email-not-configured" })) };
    }

    const transporter = this.getTransporter();
    const icsContent = this.buildIcsContent(meeting);
    const meetLink = meeting.meetingLink || meeting.link || "";

    const sendOne = async (recipient) => {
      const html = this.buildInviteHtml({
        meeting,
        recipientName: recipient.name || recipient.email,
        joinLink: recipient.joinLink,
        meetLink,
      });

      await transporter.sendMail({
        from: `"MOM System" <${this.getEnv("EMAIL_USER", "SMTP_USER")}>`,
        to: recipient.email,
        subject: `Meeting Invitation: ${meeting.title}`,
        html,
        attachments: [
          {
            filename: "invite.ics",
            content: icsContent,
            contentType: "text/calendar; method=REQUEST",
          },
        ],
      });
    };

    const results = await Promise.allSettled(recipients.map(sendOne));
    const failed = results
      .map((result, index) =>
        result.status === "rejected"
          ? { email: recipients[index].email, reason: result.reason?.message || "Failed to send invite" }
          : null
      )
      .filter(Boolean);

    return {
      sent: recipients.length - failed.length,
      failed,
    };
  }

  async sendMeetingReminder({ meeting, recipients, minutesBefore }) {
    if (!this.isConfigured()) {
      return { sent: 0, failed: recipients.map((email) => ({ email, reason: "email-not-configured" })) };
    }

    const transporter = this.getTransporter();
    const html = this.buildReminderHtml({ meeting, minutesBefore });
    const results = await Promise.allSettled(
      recipients.map((email) =>
        transporter.sendMail({
          from: `"MOM System" <${this.getEnv("EMAIL_USER", "SMTP_USER")}>`,
          to: email,
          subject: `Reminder: ${meeting.title} starts in ${minutesBefore} minute(s)`,
          html,
        })
      )
    );

    const failed = results
      .map((result, index) =>
        result.status === "rejected" ? { email: recipients[index], reason: result.reason?.message || "Failed to send reminder" } : null
      )
      .filter(Boolean);

    return {
      sent: recipients.length - failed.length,
      failed,
    };
  }

  async verifyConnection() {
    if (!this.isConfigured()) {
      return { ok: false, reason: "SMTP/email env vars are missing" };
    }

    const transporter = this.getTransporter();
    await transporter.verify();
    return { ok: true };
  }
}

module.exports = new EmailService();
