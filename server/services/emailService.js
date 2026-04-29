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
    const baseUrl = "http://10.125.183.132:5000"; // Backend URL (Port 5000)

    const html = `
      <div style="font-family:sans-serif; background:#f1f5f9; padding:40px;">
        <div style="max-width:600px; margin:0 auto; background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 4px 6px rgba(0,0,0,0.1);">
          <div style="padding:30px; background:#0f172a; color:#fff; text-align:center;">
            <h2>New Visitor Arrival</h2>
            <p>Please review and approve this meeting request.</p>
          </div>
          <div style="padding:30px; text-align:center;">
            ${visitor.photoUrl ? `<img src="${visitor.photoUrl}" style="width:120px; height:120px; border-radius:60px; object-fit:cover; margin-bottom:20px; border:4px solid #f1f5f9;" />` : ''}
            <table style="width:100%; text-align:left; border-collapse:collapse; margin-bottom:30px;">
              <tr><td style="padding:10px; border-bottom:1px solid #f1f5f9;"><strong>Visitor Name:</strong></td><td style="padding:10px; border-bottom:1px solid #f1f5f9;">${this.escapeHtml(visitor.name)}</td></tr>
              <tr><td style="padding:10px; border-bottom:1px solid #f1f5f9;"><strong>Mobile:</strong></td><td style="padding:10px; border-bottom:1px solid #f1f5f9;">${this.escapeHtml(visitor.mobile)}</td></tr>
              <tr><td style="padding:10px; border-bottom:1px solid #f1f5f9;"><strong>Purpose:</strong></td><td style="padding:10px; border-bottom:1px solid #f1f5f9;">${this.escapeHtml(visitor.purpose)}</td></tr>
            </table>
            
            <div style="display:flex; justify-content:center; gap:20px;">
              <a href="${baseUrl}/api/visitors/action/approve/${visitor._id}" style="padding:14px 30px; background:#10b981; color:#fff; text-decoration:none; border-radius:8px; font-weight:bold; margin-right:10px; display:inline-block;">APPROVE MEETING</a>
              <a href="${baseUrl}/api/visitors/action/reject/${visitor._id}" style="padding:14px 30px; background:#ef4444; color:#fff; text-decoration:none; border-radius:8px; font-weight:bold; display:inline-block;">REJECT</a>
            </div>
          </div>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"Visitor System" <${this.getEnv("EMAIL_USER")}>`,
      to: visitor.meetingWithEmail,
      subject: `Visitor Action Required: ${visitor.name}`,
      html,
    });
    console.log(`✅ Approval request sent to host: ${visitor.meetingWithEmail}`);
  }

  // 2. Send Pending Email to Visitor (Form Submitted Successfully)
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

    await transporter.sendMail({
      from: `"GT MOM Visitor" <${this.getEnv("EMAIL_USER")}>`,
      to: visitor.email,
      subject: `Form Submitted Successfully - Visitor Request Recorded`,
      html,
    });
    console.log(`✅ Pending notification sent to visitor: ${visitor.email}`);
  }

  // 3. Send Final Result to Visitor (Approved/Rejected)
  async sendFinalResultToVisitor(visitor) {
    if (!this.isConfigured()) return;
    const transporter = this.getTransporter();
    const isApproved = visitor.status === "APPROVED";
    
    const html = `
      <div style="font-family:sans-serif; background:#f8fafc; padding:40px;">
        <div style="max-width:600px; margin:0 auto; background:#fff; border-radius:16px; padding:40px; text-align:center; border:1px solid #e2e8f0;">
          <h2 style="color:${isApproved ? '#10b981' : '#ef4444'}; margin-bottom:15px;">
            ${isApproved ? 'Meeting Approved!' : 'Meeting Request Rejected'}
          </h2>
          <p style="color:#0f172a; font-size:16px; font-weight:600;">
            Hello ${this.escapeHtml(visitor.name)},
          </p>
          <p style="color:#64748b; font-size:16px; line-height:1.6;">
            ${isApproved 
              ? `Great news! <strong>${this.escapeHtml(visitor.meetingWithName)}</strong> has approved your meeting request.`
              : `Unfortunately, your request to meet <strong>${this.escapeHtml(visitor.meetingWithName)}</strong> could not be approved at this time.`}
          </p>

          ${isApproved ? `
            <div style="margin-top:30px; padding:24px; background:#f0fdf4; border:2px dashed #10b981; border-radius:16px;">
              <p style="color:#065f46; font-weight:bold; margin-bottom:15px;">YOUR ENTRY PASS QR CODE</p>
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${visitor._id}" style="width:200px; height:200px; border-radius:12px; background:#fff; padding:10px;" alt="Entry QR" />
              <p style="color:#64748b; font-size:12px; margin-top:15px;">Please show this QR code at the reception when you arrive.</p>
            </div>
          ` : ''}
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"GT MOM Visitor" <${this.getEnv("EMAIL_USER")}>`,
      to: visitor.email,
      subject: isApproved ? `Meeting Approved by ${visitor.meetingWithName}` : `Meeting Update`,
      html,
    });
    console.log(`✅ Final status (${visitor.status}) sent to visitor: ${visitor.email}`);
  }
}

module.exports = new EmailService();
