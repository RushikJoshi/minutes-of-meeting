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
          auth: { user, pass },
        });
      } else if (host) {
        this._transporter = nodemailer.createTransport({
          host, port, secure,
          auth: { user, pass },
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
