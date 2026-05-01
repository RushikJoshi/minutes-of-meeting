const nodemailer = require("nodemailer");

class EmailService {
  constructor() {
    this._transporter = null;
  }

  getEnv(name, fallbackName = "") {
    return process.env[name] || (fallbackName ? process.env[fallbackName] : "");
  }

  getTimeout(name, fallbackName = "", defaultValue = 8000) {
    const raw = this.getEnv(name, fallbackName);
    const parsed = Number.parseInt(String(raw || ""), 10);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : defaultValue;
  }

  getTransporter() {
    if (!this._transporter) {
      const host = this.getEnv("EMAIL_HOST", "SMTP_HOST");
      const service = this.getEnv("EMAIL_SERVICE");
      const user = this.getEnv("EMAIL_USER", "SMTP_USER");
      const pass = this.getEnv("EMAIL_PASS", "SMTP_PASS");
      const port = parseInt(this.getEnv("EMAIL_PORT", "SMTP_PORT") || "587", 10);
      const secure = this.getEnv("EMAIL_SECURE", "SMTP_SECURE") === "true";
      const connectionTimeout = this.getTimeout("EMAIL_CONNECTION_TIMEOUT_MS", "SMTP_CONNECTION_TIMEOUT_MS", 8000);
      const greetingTimeout = this.getTimeout("EMAIL_GREETING_TIMEOUT_MS", "SMTP_GREETING_TIMEOUT_MS", 8000);
      const socketTimeout = this.getTimeout("EMAIL_SOCKET_TIMEOUT_MS", "SMTP_SOCKET_TIMEOUT_MS", 10000);

      if (service) {
        this._transporter = nodemailer.createTransport({
          service,
          auth: { user, pass },
          connectionTimeout,
          greetingTimeout,
          socketTimeout,
        });
      } else if (host) {
        this._transporter = nodemailer.createTransport({
          host, port, secure,
          auth: { user, pass },
          connectionTimeout,
          greetingTimeout,
          socketTimeout,
        });
      }
    }
    return this._transporter;
  }

  async verifyConnection() {
    try {
      const transporter = this.getTransporter();
      if (!transporter) throw new Error("Email configuration missing");
      await transporter.verify();
      console.log("✅ SMTP Connection Success");
      return true;
    } catch (err) {
      console.error("❌ SMTP Connection Failed:", err.message);
      return false;
    }
  }

  isConfigured() {
    return !!(this.getEnv("EMAIL_USER", "SMTP_USER") && this.getEnv("EMAIL_PASS", "SMTP_PASS"));
  }

  escapeHtml(value) {
    return String(value || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  formatDateTime({ date, timezone }) {
    try {
      const dt = new Date(date);
      if (Number.isNaN(dt.getTime())) return "";
      return dt.toLocaleString("en-IN", {
        timeZone: timezone || undefined,
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  }

  async sendMeetingInvitation({ meeting, recipients, cc = [] }) {
    if (!this.isConfigured()) return { sent: 0, failed: recipients?.map((r) => ({ email: r.email, error: "Email not configured" })) || [] };
    const transporter = this.getTransporter();
    if (!transporter) {
      return { sent: 0, failed: recipients?.map((r) => ({ email: r.email, error: "Email transport not configured" })) || [] };
    }

    const list = Array.isArray(recipients) ? recipients : [];
    if (list.length === 0) return { sent: 0, failed: [] };

    const { getPublicClientBaseUrl } = require("../utils/publicClientBase");
    const frontendBase = getPublicClientBaseUrl() || this.getEnv("PUBLIC_CLIENT_BASE_URL") || "http://localhost:5174";
    const safeCc = (Array.isArray(cc) ? cc : [])
      .map((v) => String(v || "").trim())
      .filter(Boolean);
    const ccLine = safeCc.length ? safeCc.join(", ") : "";

    const title = meeting?.title || "Meeting";
    const agenda = meeting?.agenda || "";
    const description = meeting?.description || "";
    const meetingType = meeting?.type || "online";
    const location = meeting?.location || "";
    const platform = meeting?.platform || (meetingType === "online" ? "zoom" : "offline");
    const meetingLink = meeting?.meetingLink || meeting?.link || "";
    const hasRealMeetingLink =
      Boolean(meetingLink) &&
      typeof meetingLink === "string" &&
      !meetingLink.includes("zoom.us/test") &&
      !meetingLink.includes("zoom.us/start/videomeeting") &&
      !meetingLink.includes("meet.google.com/new");
    const when = this.formatDateTime({ date: meeting?.startTime || meeting?.date, timezone: meeting?.timezone });

    const detailsLink = meeting?._id ? `${frontendBase}/meeting/${meeting._id}` : frontendBase;

    const subject = `Invitation: ${title}${when ? ` \u2022 ${when}` : ""}`;

    const sendOne = async (recipient) => {
      const to = String(recipient?.email || "").trim();
      if (!to) return { skipped: true };

      const joinLink = recipient?.joinLink || "";
      const hostLink = recipient?.hostLink || "";

      const html = `
        <div style="background:#f1f5f9; padding:24px 12px; font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;">
          <style>
            @media (max-width: 600px) {
              .container { width: 100% !important; }
              .stack { display:block !important; width:100% !important; }
              .btn { display:block !important; width:100% !important; box-sizing:border-box !important; }
              .px { padding-left:16px !important; padding-right:16px !important; }
            }
          </style>
          <table class="container" role="presentation" cellpadding="0" cellspacing="0" style="width:600px; max-width:600px; margin:0 auto; background:#ffffff; border:1px solid #e2e8f0; border-radius:18px; overflow:hidden;">
            <tr>
              <td style="background:linear-gradient(135deg,#2563eb,#7c3aed); padding:20px 24px; color:#fff;" class="px">
                <div style="font-size:12px; letter-spacing:0.16em; text-transform:uppercase; opacity:0.9; font-weight:800;">GT MOM</div>
                <div style="font-size:22px; font-weight:900; margin-top:8px;">You're invited: ${this.escapeHtml(title)}</div>
                ${when ? `<div style="margin-top:8px; font-size:14px; opacity:0.95;">${this.escapeHtml(when)}${meeting?.timezone ? ` (${this.escapeHtml(meeting.timezone)})` : ""}</div>` : ""}
                <div style="margin-top:10px; font-size:12px; opacity:0.9;"><strong>Subject:</strong> ${this.escapeHtml(subject)}</div>
                ${ccLine ? `<div style="margin-top:8px; font-size:12px; opacity:0.9;"><strong>CC:</strong> ${this.escapeHtml(ccLine)}</div>` : ""}
              </td>
            </tr>
            <tr>
              <td style="padding:22px 24px;" class="px">
                <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;">
                  <tr>
                    <td class="stack" style="width:58%; vertical-align:top; padding-right:12px;">
                      <div style="font-size:12px; font-weight:900; color:#64748b; text-transform:uppercase; letter-spacing:0.14em;">Details</div>
                      <div style="margin-top:10px; color:#0f172a; font-size:14px; line-height:1.6;">
                        <div><strong>Type:</strong> ${this.escapeHtml(meetingType === "offline" ? "Offline" : "Online")} ${meetingType === "online" ? `(${this.escapeHtml(platform)})` : ""}</div>
                        ${meetingType === "offline" ? `<div><strong>Location:</strong> ${this.escapeHtml(location || "TBD")}</div>` : ""}
                        ${agenda ? `<div style="margin-top:10px;"><strong>Agenda:</strong> ${this.escapeHtml(agenda)}</div>` : ""}
                        ${description ? `<div style="margin-top:10px;"><strong>Description:</strong> ${this.escapeHtml(description)}</div>` : ""}
                      </div>
                    </td>
                    <td class="stack" style="width:42%; vertical-align:top; padding-left:12px;">
                      <div style="font-size:12px; font-weight:900; color:#64748b; text-transform:uppercase; letter-spacing:0.14em;">Actions</div>
                      <div style="margin-top:12px;">
                        ${joinLink ? `<a class="btn" href="${joinLink}" style="display:inline-block; background:#2563eb; color:#fff; text-decoration:none; font-weight:900; padding:12px 14px; border-radius:12px; text-align:center; width:100%; box-shadow:0 10px 18px rgba(37,99,235,0.18);">Accept invite & join</a>` : ""}
                        ${meetingType === "online" && hasRealMeetingLink ? `<a class="btn" href="${meetingLink}" style="display:inline-block; margin-top:10px; background:#ffffff; color:#1e293b; text-decoration:none; font-weight:800; padding:12px 14px; border-radius:12px; text-align:center; width:100%; border:1px solid #e2e8f0;">Open ${this.escapeHtml(platform)} meeting link</a>` : ""}
                        ${hostLink ? `<a class="btn" href="${hostLink}" style="display:inline-block; margin-top:10px; background:#0f172a; color:#ffffff; text-decoration:none; font-weight:900; padding:12px 14px; border-radius:12px; text-align:center; width:100%; box-shadow:0 10px 18px rgba(15,23,42,0.22);">Start as host</a>` : ""}
                        <a class="btn" href="${detailsLink}" style="display:inline-block; margin-top:10px; background:#f8fafc; color:#0f172a; text-decoration:none; font-weight:800; padding:12px 14px; border-radius:12px; text-align:center; width:100%; border:1px dashed #cbd5e1;">View in MOM</a>
                      </div>
                    </td>
                  </tr>
                </table>
                <div style="margin-top:18px; padding:14px 14px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; font-size:12px; color:#475569; line-height:1.6;">
                  ${joinLink ? `<div><strong>Invite link:</strong> <a href="${joinLink}" style="color:#2563eb; word-break:break-all;">${joinLink}</a></div>` : ""}
                  ${meetingType === "online" && hasRealMeetingLink ? `<div style="margin-top:8px;"><strong>Meeting link:</strong> <a href="${meetingLink}" style="color:#2563eb; word-break:break-all;">${meetingLink}</a></div>` : ""}
                  ${hostLink ? `<div style="margin-top:8px;"><strong>Host link:</strong> <a href="${hostLink}" style="color:#2563eb; word-break:break-all;">${hostLink}</a></div>` : ""}
                  <div style="margin-top:8px;"><strong>Details:</strong> <a href="${detailsLink}" style="color:#2563eb; word-break:break-all;">${detailsLink}</a></div>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:14px 24px; background:#ffffff; border-top:1px solid #e2e8f0; color:#94a3b8; font-size:12px;" class="px">
                This invite was sent by GT MOM. If you weren't expecting this, you can ignore this email.
              </td>
            </tr>
          </table>
        </div>
      `;

      const textParts = [
        `Subject: ${subject}`,
        ccLine ? `CC: ${ccLine}` : "",
        `You're invited: ${title}`,
        when ? `When: ${when}${meeting?.timezone ? ` (${meeting.timezone})` : ""}` : "",
        meetingType === "offline" ? `Location: ${location || "TBD"}` : hasRealMeetingLink ? `Meeting link: ${meetingLink}` : "",
        joinLink ? `Invite link: ${joinLink}` : "",
        hostLink ? `Host link: ${hostLink}` : "",
        `Details: ${detailsLink}`,
      ].filter(Boolean);

      try {
        await transporter.sendMail({
          from: `"GT MOM" <${this.getEnv("EMAIL_USER", "SMTP_USER")}>`,
          to,
          cc: safeCc.length ? safeCc : undefined,
          subject,
          text: textParts.join("\n"),
          html,
        });
        return { sent: true, email: to };
      } catch (err) {
        return { sent: false, email: to, error: err?.message || "Failed to send" };
      }
    };

    const outcomes = await Promise.allSettled(list.map((recipient) => sendOne(recipient)));
    const failed = [];
    let sent = 0;

    outcomes.forEach((outcome) => {
      const value = outcome.status === "fulfilled" ? outcome.value : { sent: false, error: outcome.reason?.message || "Failed to send" };
      if (value?.skipped) return;
      if (value?.sent) {
        sent += 1;
      } else {
        failed.push({ email: value?.email || "", error: value?.error || "Failed to send" });
      }
    });

    return { sent, failed };
  }

  // 1. Send Request to Host (Approve/Reject)
  async sendApprovalRequestToHost(visitor) {
    if (!this.isConfigured()) return;
    const transporter = this.getTransporter();

    // IMPORTANT: Make sure this matches your server IP for buttons to work
    const baseUrl = this.getEnv("PUBLIC_API_BASE_URL") || "http://192.168.1.19:5000";

    // Construct Full Photo URL (Relative to Base URL if stored as file)
    const displayPhotoUrl = visitor.photoUrl
      ? (visitor.photoUrl.startsWith('data:') || visitor.photoUrl.startsWith('http')
        ? visitor.photoUrl
        : `${baseUrl}${visitor.photoUrl}`)
      : null;

    const timeStr = visitor.meetingTime ? new Date(visitor.meetingTime).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }) : "Immediate / Not Specified";

    const docType = visitor.document?.type || "DOCUMENT";
    const docNumber = visitor.document?.number || "Not Provided";
    const address = visitor.address || "Not Specified";

    const html = `
      <div style="font-family:sans-serif; background:#f1f5f9; padding:40px;">
        <div style="max-width:600px; margin:0 auto; background:#fff; border-radius:24px; overflow:hidden; box-shadow:0 10px 25px rgba(0,0,0,0.05);">
          <div style="padding:40px 30px; background:#7c3aed; color:#fff; text-align:center;">
            <div style="font-size:40px; margin-bottom:15px;">👋</div>
            <h2 style="margin:0; font-size:24px; font-weight:800; letter-spacing:-0.5px;">New Visitor Request</h2>
            <p style="opacity:0.9; margin-top:10px; font-size:15px;">A visitor is waiting for your approval.</p>
          </div>
          
          <div style="padding:40px 35px; text-align:center;">
            <div style="padding:25px; background:#f8fafc; border-radius:16px; margin-bottom:30px; border:1px solid #e2e8f0; font-size:15px; color:#475569; line-height:1.6;">
              <p style="margin:0 0 10px 0; font-weight:700; color:#1e293b;">Visitor: ${this.escapeHtml(visitor.name)}</p>
              <p style="margin:0;">Please review the attached <strong>PDF file</strong> for complete details and photo of the visitor.</p>
            </div>
            
            <div style="display:block; margin-top:10px;">
              <a href="${baseUrl}/api/visitors/action/approve/${visitor._id}" style="display:inline-block; padding:18px 30px; background:#10b981; color:#fff; text-decoration:none; border-radius:16px; font-weight:bold; margin-bottom:15px; width:220px; font-size:14px; text-transform:uppercase; letter-spacing:1px; box-shadow:0 10px 20px rgba(16,185,129,0.15);">Approve Visit</a>
              <br/>
              <a href="${baseUrl}/api/visitors/action/reject/${visitor._id}" style="display:inline-block; padding:15px 30px; background:#fff; color:#ef4444; text-decoration:none; border-radius:16px; font-weight:bold; width:220px; font-size:14px; text-transform:uppercase; letter-spacing:1px; border:2px solid #fee2e2;">Reject Request</a>
            </div>
          </div>
        </div>
        <p style="text-align:center; color:#94a3b8; font-size:12px; margin-top:25px;">This is an automated request from GT MOM Visitor Management System.</p>
      </div>
    `;

    let attachments = [];
    try {
      const pdfService = require("./pdfService");
      const pdfBuffer = await pdfService.generateVisitorPdf(visitor, baseUrl);
      attachments.push({
        filename: `Visitor_Details_${visitor.name.replace(/\s+/g, '_')}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      });
    } catch (err) {
      console.error("Error generating PDF attachment:", err.message);
    }

    try {
      await transporter.sendMail({
        from: `"Visitor System" <${this.getEnv("EMAIL_USER")}>`,
        to: visitor.meetingWithEmail,
        subject: `Visitor Action Required: ${visitor.name}`,
        html,
        attachments
      });
      console.log(`✅ Approval request sent to host: ${visitor.meetingWithEmail}`);
    } catch (err) {
      console.error(`❌ Mail Error (Approval Request):`, err.message);
    }
  }

  async sendMeetingReminder({ meeting, recipients, minutesBefore = 0 }) {
    if (!this.isConfigured()) {
      return {
        sent: 0,
        failed: (Array.isArray(recipients) ? recipients : []).map((r) => ({
          email: typeof r === "string" ? r : r?.email,
          error: "Email not configured",
        })),
      };
    }

    const transporter = this.getTransporter();
    const list = Array.isArray(recipients) ? recipients : [];
    const toList = list
      .map((r) => (typeof r === "string" ? r : r?.email))
      .map((v) => String(v || "").trim())
      .filter(Boolean);

    if (toList.length === 0) return { sent: 0, failed: [] };

    const { getPublicClientBaseUrl } = require("../utils/publicClientBase");
    const frontendBase = getPublicClientBaseUrl() || this.getEnv("PUBLIC_CLIENT_BASE_URL") || "http://localhost:5174";
    const title = meeting?.title || "Meeting";
    const when = this.formatDateTime({ date: meeting?.startTime || meeting?.date, timezone: meeting?.timezone });
    const detailsLink = meeting?._id ? `${frontendBase}/meeting/${meeting._id}` : frontendBase;

    const subject = `Reminder: ${title}${minutesBefore ? ` (in ${minutesBefore} min)` : ""}${when ? ` \u2022 ${when}` : ""}`;

    const html = `
      <div style="background:#f1f5f9; padding:24px 12px; font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;">
        <table role="presentation" cellpadding="0" cellspacing="0" style="width:600px; max-width:600px; margin:0 auto; background:#ffffff; border:1px solid #e2e8f0; border-radius:18px; overflow:hidden;">
          <tr>
            <td style="background:linear-gradient(135deg,#f97316,#7c3aed); padding:20px 24px; color:#fff;">
              <div style="font-size:12px; letter-spacing:0.16em; text-transform:uppercase; opacity:0.9; font-weight:800;">GT MOM</div>
              <div style="font-size:22px; font-weight:900; margin-top:8px;">Reminder: ${this.escapeHtml(title)}</div>
              ${when ? `<div style="margin-top:8px; font-size:14px; opacity:0.95;">${this.escapeHtml(when)}${meeting?.timezone ? ` (${this.escapeHtml(meeting.timezone)})` : ""}</div>` : ""}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 24px; color:#0f172a;">
              <p style="margin:0 0 12px; font-size:15px; line-height:1.6; color:#334155;">
                Your meeting is coming up${minutesBefore ? ` in <strong>${this.escapeHtml(minutesBefore)}</strong> minutes` : ""}.
              </p>
              <div style="margin:16px 0; padding:14px 16px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:14px;">
                ${meeting?.agenda ? `<div style="font-weight:800; margin-bottom:6px;">Agenda</div><div style="color:#475569; line-height:1.6;">${this.escapeHtml(meeting.agenda)}</div>` : `<div style="color:#475569;">Open the meeting details for agenda and links.</div>`}
              </div>
              <a href="${detailsLink}" style="display:inline-block; background:#7c3aed; color:#fff; text-decoration:none; padding:12px 16px; border-radius:12px; font-weight:800;">
                Open meeting details
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 24px; font-size:12px; color:#94a3b8; background:#ffffff; border-top:1px solid #e2e8f0;">
              If you didnâ€™t expect this email, you can ignore it.
            </td>
          </tr>
        </table>
      </div>
    `;

    try {
      await transporter.sendMail({
        from: `"GT MOM" <${this.getEnv("EMAIL_USER")}>`,
        to: toList.join(","),
        subject,
        html,
      });
      return { sent: toList.length, failed: [] };
    } catch (err) {
      return {
        sent: 0,
        failed: toList.map((email) => ({ email, error: err?.message || "Failed to send" })),
      };
    }
  }

  // 2. Send Pending Email to Visitor
  async sendPendingNotificationToVisitor(visitor) {
    if (!this.isConfigured()) return;
    const transporter = this.getTransporter();
    const html = `
      <div style="font-family:sans-serif; background:#f8fafc; padding:40px;">
        <div style="max-width:600px; margin:0 auto; background:#fff; border-radius:16px; padding:40px; text-align:center; border:1px solid #e2e8f0;">
          <div style="font-size:48px; margin-bottom:20px;">✅</div>
          <h2 style="color:#0f172a; margin-bottom:10px;">Form Submitted Successfully!</h2>
          <p style="color:#64748b; font-size:16px; line-height:1.6;">
            Hello <strong>${this.escapeHtml(visitor.name)}</strong>,<br><br>
            Your visit request for <strong>${this.escapeHtml(visitor.meetingWithName)}</strong> has been recorded.
          </p>
          <div style="margin-top:20px; padding:15px; background:#fff9db; border-radius:8px; color:#856404; font-size:14px; font-weight:600;">
            Status: PENDING HOST APPROVAL
          </div>
          <p style="color:#64748b; margin-top:20px; font-size:14px;">
            We will notify you immediately once your meeting is approved.
          </p>
        </div>
      </div>
    `;

    try {
      await transporter.sendMail({
        from: `"GT MOM Visitor" <${this.getEnv("EMAIL_USER")}>`,
        to: visitor.email,
        subject: `Form Submitted Successfully`,
        html,
      });
      console.log(`✅ Pending notification sent to visitor: ${visitor.email}`);
    } catch (err) {
      console.error(`❌ Mail Error (Pending Notify):`, err.message);
    }
  }

  // 3. Send Final Result to Visitor (Approved/Rejected)
  async sendFinalResultToVisitor(visitor) {
    if (!this.isConfigured()) return;
    const transporter = this.getTransporter();
    const isApproved = visitor.status === "APPROVED";
    
    // BACKEND URL (for API calls)
    const backendUrl = this.getEnv("PUBLIC_API_BASE_URL") || "http://192.168.1.19:5000";
    // FRONTEND URL (for QR code and verification page)
    const frontendUrl = backendUrl.replace(":5000", ":5174");

    const html = `
      <div style="font-family:sans-serif; background:#f8fafc; padding:15px;">
        <div style="max-width:600px; margin:0 auto; background:#fff; border-radius:16px; padding:25px 15px; text-align:center; border:1px solid #e2e8f0;">
          <h2 style="color:${isApproved ? '#10b981' : '#ef4444'}; margin-bottom:15px;">
            ${isApproved ? 'Meeting Approved!' : 'Meeting Request Rejected'}
          </h2>
          <p style="color:#0f172a; font-size:16px; font-weight:600;">
            Hello ${this.escapeHtml(visitor.name)},
          </p>
          <p style="color:#64748b; font-size:15px; line-height:1.6;">
            ${isApproved
        ? `Great news! <strong>${this.escapeHtml(visitor.meetingWithName)}</strong> has approved your meeting request.`
        : `Unfortunately, your request to meet <strong>${this.escapeHtml(visitor.meetingWithName)}</strong> could not be approved at this time.`}
          </p>

          ${isApproved ? `
            <div style="margin-top:25px; padding:30px 20px; background:#f0fdf4; border:2px dashed #10b981; border-radius:24px; text-align:center;">
              <p style="color:#065f46; font-weight:bold; margin-bottom:15px; font-size:14px; text-transform:uppercase; letter-spacing:1px;">Your Secure Entry Pass</p>
              
              <div style="background:#fff; padding:20px; border-radius:16px; border:1px solid #d1fae5; display:inline-block; margin-bottom:20px;">
                <img src="https://api.qrserver.com/v1/create-qr-code/?size=160x160&margin=10&data=${frontendUrl}/visitor/verify/${visitor.token}" style="width:160px; height:160px; border-radius:12px;" alt="Entry QR" />
              </div>

              <div style="margin-top:10px;">
                <p style="color:#64748b; font-size:12px; font-weight:bold; margin-bottom:8px; text-transform:uppercase;">6-Digit Entry Code</p>
                <span style="background:#10b981; color:#fff; padding:12px 30px; border-radius:16px; font-weight:900; font-size:32px; letter-spacing:4px; box-shadow:0 10px 20px rgba(16,185,129,0.2); display:inline-block;">${visitor.entryCode}</span>
              </div>
              
              <p style="color:#64748b; font-size:13px; margin-top:25px; line-height:1.5;">
                Please show this <strong>QR code</strong> or provide the <strong>6-digit code</strong> at the reception desk upon arrival.
              </p>
            </div>
          ` : ''}
        </div>
      </div>
    `;

    try {
      await transporter.sendMail({
        from: `"GT MOM Visitor" <${this.getEnv("EMAIL_USER")}>`,
        to: visitor.email,
        subject: isApproved ? `Meeting Approved by ${visitor.meetingWithName}` : `Meeting Update`,
        html,
      });
      console.log(`✅ Final status (${visitor.status}) sent to visitor: ${visitor.email}`);
    } catch (err) {
      console.error(`❌ Mail Error (Final Result):`, err.message);
    }
  }
}

module.exports = new EmailService();
