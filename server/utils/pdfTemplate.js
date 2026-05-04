function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(date) {
  if (!date) return "—";
  try {
    return new Date(date).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  } catch {
    return "—";
  }
}

function formatTime(date) {
  if (!date) return "—";
  try {
    return new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "—";
  }
}

function buildMomHtml({ meeting, mom, baseUrl }) {
  const title = escapeHtml(meeting?.title || "Minutes of Meeting");
  const date = formatDate(meeting?.date);
  
  // Strip out editor tips from the PDF
  let cleanContent = mom?.contentHtml || "";
  
  // Replace Dynamic Tokens in PDF
  if (meeting && cleanContent.includes("[")) {
    const participantsList = Array.isArray(meeting.participants)
      ? meeting.participants.map(p => p.name || p.email).filter(Boolean).join(", ")
      : "—";
    
    const replacements = {
      "[MEETING_TITLE]": meeting.title || "Untitled Meeting",
      "[DATE]": formatDate(meeting.date),
      "[TIME]": meeting.startTime || meeting.actualStartTime ? formatTime(meeting.actualStartTime || meeting.startTime) : "—",
      "[CREATOR]": meeting.createdBy?.name || "Admin",
      "[PARTICIPANTS]": participantsList,
      "[AGENDA]": meeting.agenda || meeting.description || "No agenda"
    };

    Object.entries(replacements).forEach(([token, value]) => {
      // Use case-insensitive global replacement for the token
      const regex = new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      cleanContent = cleanContent.replace(regex, value);
    });
  }

  // Fallback: Also replace hardcoded "MEETING TITLE" if the token [MEETING_TITLE] was missing
  // This must be outside the if block to handle old templates correctly.
  cleanContent = cleanContent.replace(/MEETING TITLE/gi, meeting?.title || "Untitled Meeting");

  cleanContent = cleanContent.replace(/<p[^>]*>\s*\(Tip:[\s\S]*?<\/p>/gi, "");

  return `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>${title}</title>
      <style>
        :root { --fg:#0b1220; --muted:#5b6b84; --border:#e5eaf3; --bg:#ffffff; --brand:#1d4ed8; }
        * { box-sizing: border-box; }
        html, body { padding: 0; margin: 0; background: var(--bg); }
        body { 
          font-family: -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif; 
          color: var(--fg); 
          padding: 15mm;
          font-size: 14px;
          line-height: 1.6;
        }
        @page { size: A4; margin: 0; }
        
        /* Table Styles for Template Content */
        table { width: 100%; border-collapse: collapse; margin: 20px 0; border: 1px solid #e2e8f0; }
        th, td { border: 1px solid #e2e8f0; padding: 12px; text-align: left; vertical-align: top; }
        th { background-color: #f8fafc; font-weight: 600; }
        
        /* Typography - Ensure matching the Template Builder styles */
        h1 { text-align: center; margin-bottom: 20px; font-size: 24px; font-weight: 700; }
        p { margin: 10px 0; }
        strong { font-weight: 700; }
        u { text-decoration: underline; }
        
        .content-area {
          width: 100%;
        }
        
        /* Clean up standard Tiptap/HTML list styles */
        ul, ol { margin: 10px 0 10px 25px; }
      </style>
    </head>
    <body>
      <div class="content-area">
        ${cleanContent || '<p style="text-align:center; color:#94a3b8; margin-top:100px;">No content recorded.</p>'}
      </div>
    </body>
  </html>`;
}

module.exports = { buildMomHtml };