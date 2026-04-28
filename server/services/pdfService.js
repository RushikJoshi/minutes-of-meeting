const puppeteer = require("puppeteer-core");

/**
 * PDF Service to generate meeting minutes reports.
 */
class PdfService {
  /**
   * Generate PDF from MOM data
   */
  async generateMomPdf(mom, meeting) {
    const browser = await puppeteer.launch({
      headless: true,
      executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();

    const dateStr = mom.date ? new Date(mom.date).toLocaleDateString() : (meeting.date ? new Date(meeting.date).toLocaleDateString() : "N/A");
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
          
          body { 
            font-family: 'Inter', 'Helvetica', sans-serif; 
            padding: 50px; 
            color: #1e293b; 
            line-height: 1.5; 
            background: #fff;
          }
          
          .header { 
            border-bottom: 3px solid #2563eb; 
            padding-bottom: 20px; 
            margin-bottom: 40px; 
            text-align: center;
          }
          
          .company-name {
            font-size: 14px;
            font-weight: 700;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            margin-bottom: 8px;
          }
          
          .title { 
            font-size: 28px; 
            font-weight: 800; 
            color: #0f172a; 
            margin: 0;
          }
          
          .subtitle {
            font-size: 16px;
            color: #475569;
            margin-top: 5px;
          }
          
          .section { margin-bottom: 35px; break-inside: avoid; }
          
          .section-title { 
            font-size: 16px; 
            font-weight: 700; 
            color: #1e40af; 
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 8px;
            margin-bottom: 15px; 
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          
          .grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            background: #f8fafc;
            padding: 20px;
            border-radius: 12px;
            font-size: 13px;
          }
          
          .grid-item { display: flex; flex-direction: column; }
          .label { font-weight: 700; color: #64748b; font-size: 11px; text-transform: uppercase; margin-bottom: 2px; }
          .value { color: #0f172a; font-size: 14px; }
          
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; border-radius: 8px; overflow: hidden; }
          th, td { border: 1px solid #e2e8f0; padding: 12px; text-align: left; }
          th { background: #f1f5f9; color: #475569; font-weight: 700; text-transform: uppercase; font-size: 11px; }
          
          .text-block { 
            background: #f8fafc; 
            padding: 15px; 
            border-radius: 12px; 
            font-size: 13px; 
            white-space: pre-wrap;
            border-left: 4px solid #cbd5e1;
          }
          
          .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            font-size: 10px;
            color: #94a3b8;
            text-align: center;
          }
          
          .sign-off-grid {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 30px;
            margin-top: 20px;
            text-align: center;
          }
          
          .sign-box {
            padding-top: 15px;
            border-top: 1px dashed #cbd5e1;
          }
          
          .confidential {
            background: #fff7ed;
            border: 1px solid #fed7aa;
            color: #9a3412;
            padding: 12px;
            border-radius: 8px;
            font-size: 11px;
            text-align: center;
            font-weight: 600;
          }

          .image-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
            margin-top: 10px;
          }
          .image-item img {
            width: 100%;
            height: 120px;
            object-cover: cover;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">Official Meeting Record</div>
          <h1 class="title">Minutes of Meeting (MOM)</h1>
          <div class="subtitle">${mom.meetingTitle || meeting.title}</div>
        </div>

        <!-- 1. Meeting Details -->
        <div class="section">
          <div class="section-title">1. Meeting Details</div>
          <div class="grid">
            <div class="grid-item"><span class="label">Meeting Type</span><span class="value">${mom.meetingType || "-"}</span></div>
            <div class="grid-item"><span class="label">Date</span><span class="value">${dateStr}</span></div>
            <div class="grid-item"><span class="label">Time</span><span class="value">${mom.time || meeting.startTime || "-"}</span></div>
            <div class="grid-item"><span class="label">Duration</span><span class="value">${mom.duration || "-"}</span></div>
            <div class="grid-item"><span class="label">Venue / Platform</span><span class="value">${mom.venue || meeting.location || meeting.platform || "-"}</span></div>
            <div class="grid-item"><span class="label">Called By</span><span class="value">${mom.calledBy || "-"}</span></div>
            <div class="grid-item"><span class="label">Chaired By</span><span class="value">${mom.chairedBy || "-"}</span></div>
            <div class="grid-item"><span class="label">Reference ID</span><span class="value">${mom.referenceId || "-"}</span></div>
          </div>
        </div>

        <!-- 2. Attendees -->
        <div class="section">
          <div class="section-title">2. Attendees</div>
          <table>
            <thead>
              <tr><th>Sr. No</th><th>Name</th><th>Designation</th><th>Department</th><th>Status</th></tr>
            </thead>
            <tbody>
              ${(mom.attendeesList || []).map(a => `
                <tr><td>${a.srNo}</td><td>${a.name}</td><td>${a.designation || "-"}</td><td>${a.department || "-"}</td><td>${a.status}</td></tr>
              `).join("") || '<tr><td colspan="5" style="text-align:center">No attendees recorded</td></tr>'}
            </tbody>
          </table>
          
          ${mom.absenteesList?.length > 0 ? `
            <div style="margin-top: 15px;">
              <div class="label">Absentees / Leave</div>
              <table>
                <thead><tr><th>Name</th><th>Reason</th></tr></thead>
                <tbody>
                  ${mom.absenteesList.map(a => `<tr><td>${a.name}</td><td>${a.reason}</td></tr>`).join("")}
                </tbody>
              </table>
            </div>
          ` : ""}
        </div>

        <!-- 3. Objective -->
        ${mom.objective ? `
          <div class="section">
            <div class="section-title">3. Meeting Objective</div>
            <div class="text-block">${mom.objective}</div>
          </div>
        ` : ""}

        <!-- 4. Agenda Items -->
        ${mom.agendaItemsList?.length > 0 ? `
          <div class="section">
            <div class="section-title">4. Agenda Items</div>
            <table>
              <thead><tr><th style="width: 80px;">Item No</th><th>Agenda Topic</th><th>Owner</th></tr></thead>
              <tbody>
                ${mom.agendaItemsList.map(a => `<tr><td>${a.itemNo}</td><td>${a.agendaTopic}</td><td>${a.owner}</td></tr>`).join("")}
              </tbody>
            </table>
          </div>
        ` : ""}

        <!-- 5. Discussion Summary -->
        ${mom.discussionSummary?.length > 0 ? `
          <div class="section">
            <div class="section-title">5. Discussion Summary</div>
            <table>
              <thead><tr><th style="width: 100px;">Agenda</th><th>Key Discussion Points</th><th>Decision Taken</th></tr></thead>
              <tbody>
                ${mom.discussionSummary.map(a => `
                  <tr><td>${a.agendaId}</td><td style="white-space: pre-wrap;">${a.keyDiscussionPoints}</td><td style="white-space: pre-wrap;">${a.decisionTaken}</td></tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        ` : ""}

        <!-- 6. Action Items Tracker -->
        ${mom.actionItems?.length > 0 ? `
          <div class="section">
            <div class="section-title">6. Action Items Tracker</div>
            <table>
              <thead><tr><th style="width: 60px;">Sr No</th><th>Task</th><th>Assigned To</th><th style="width: 80px;">Priority</th><th style="width: 100px;">Deadline</th><th style="width: 80px;">Status</th></tr></thead>
              <tbody>
                ${mom.actionItems.map((a, i) => `
                  <tr><td>${a.srNo || i + 1}</td><td>${a.task}</td><td>${a.assignedTo}</td><td>${a.priority}</td><td>${a.deadline ? new Date(a.deadline).toLocaleDateString() : "-"}</td><td>${a.status}</td></tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        ` : ""}

        <!-- 7. Risks -->
        ${mom.risks?.length > 0 ? `
          <div class="section">
            <div class="section-title">7. Risks / Issues Raised</div>
            <table>
              <thead><tr><th>Sr No</th><th>Risk / Issue</th><th>Impact</th><th>Owner</th><th>Resolution Plan</th></tr></thead>
              <tbody>
                ${mom.risks.map(a => `<tr><td>${a.srNo}</td><td>${a.risk}</td><td>${a.impact}</td><td>${a.owner}</td><td>${a.resolutionPlan}</td></tr>`).join("")}
              </tbody>
            </table>
          </div>
        ` : ""}

        <!-- 9. Next Meeting -->
        <div class="section">
          <div class="section-title">9. Next Meeting Schedule</div>
          <div class="grid">
            <div class="grid-item"><span class="label">Date</span><span class="value">${mom.nextMeetingDate ? new Date(mom.nextMeetingDate).toLocaleDateString() : "-"}</span></div>
            <div class="grid-item"><span class="label">Time</span><span class="value">${mom.nextMeetingTime || "-"}</span></div>
            <div class="grid-item"><span class="label">Purpose</span><span class="value">${mom.nextMeetingPurpose || "-"}</span></div>
          </div>
        </div>

        <!-- 10. Closing Remarks -->
        ${mom.closingRemarks ? `
          <div class="section">
            <div class="section-title">10. Closing Remarks</div>
            <div class="text-block">${mom.closingRemarks}</div>
          </div>
        ` : ""}

        <!-- 11. Sign-offs -->
        <div class="section">
          <div class="section-title">11. Prepared & Approved By</div>
          <div class="sign-off-grid">
            <div class="sign-box"><div class="value">${mom.signOffPreparedBy || "-"}</div><div class="label">Prepared By</div></div>
            <div class="sign-box"><div class="value">${mom.signOffReviewedBy || "-"}</div><div class="label">Reviewed By</div></div>
            <div class="sign-box"><div class="value">${mom.signOffApprovedBy || "-"}</div><div class="label">Approved By</div></div>
          </div>
        </div>

        <!-- 12. Confidentiality -->
        <div class="confidential">
          12. CONFIDENTIALITY NOTE: This MOM contains internal business discussions and confidential information. Unauthorized sharing is prohibited.
        </div>

        <div class="footer">
          Generated by MOM System • ${new Date().toLocaleString()}
        </div>
      </body>
      </html>
    `;

    await page.setContent(htmlContent, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({ 
      format: "A4",
      margin: { top: "20px", bottom: "20px", left: "20px", right: "20px" },
      printBackground: true
    });

    await browser.close();
    return pdfBuffer;
  }
}

module.exports = new PdfService();
