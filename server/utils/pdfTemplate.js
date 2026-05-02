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

function participantToLabel(p) {
  if (!p) return "";
  if (typeof p === "string") return p;
  const name = String(p.name || "").trim();
  const email = String(p.email || "").trim();
  if (name && email) return `${name} <${email}>`;
  return name || email;
}

function buildMomHtml({ meeting, mom, baseUrl }) {
  const title = escapeHtml(meeting?.title || "Minutes of Meeting");
  const agenda = escapeHtml(meeting?.agenda || "—");
  const date = formatDate(meeting?.date);
  const timeRange =
    meeting?.actualStartTime || meeting?.actualEndTime
      ? `${formatTime(meeting?.actualStartTime)} – ${formatTime(meeting?.actualEndTime || meeting?.endTime)}`
      : (meeting?.startTime || meeting?.endTime
        ? `${formatTime(meeting?.startTime)} – ${formatTime(meeting?.endTime)}`
        : "—");
  const participants = Array.isArray(meeting?.participants)
    ? meeting.participants.map(participantToLabel).filter(Boolean)
    : [];

  const summary = escapeHtml(mom?.summary || "—");
  const discussion = escapeHtml(mom?.discussion || "—");
  const decisions = escapeHtml(mom?.decisions || "—");
  const attendees = Array.isArray(mom?.attendees) ? mom.attendees.filter(Boolean) : [];
  const actionItems = Array.isArray(mom?.actionItems) ? mom.actionItems : [];
  const attachments = Array.isArray(mom?.attachments) ? mom.attachments : [];

  const base = String(baseUrl || "").replace(/\/+$/, "");
  const images = attachments.filter(
    (a) => String(a?.mimeType || "").startsWith("image/") && a?.urlPath
  );
  const imagesHtml = images.length
    ? `<div class="images">${images
      .map(
        (img) => `<div class="img">
              <img src="${escapeHtml(`${base}${img.urlPath}`)}" alt="${escapeHtml(img.originalName || "image")}" />
              <div class="imgcap">${escapeHtml(img.originalName || "")}</div>
            </div>`
      )
      .join("")}</div>`
    : `<div class="value muted">—</div>`;

  const actionItemsRowsHtml = actionItems.length
    ? actionItems
        .map((item) => {
          const task = escapeHtml(item?.task || "—");
          const assignedTo = escapeHtml(item?.assignedTo || "—");
          const deadline = formatDate(item?.deadline);
          const status = escapeHtml(item?.status || "pending");
          return `
              <tr>
                <td>${task}</td>
                <td>${assignedTo}</td>
                <td>${deadline}</td>
                <td><span class="badge ${status === "done" ? "done" : "pending"}">${status}</span></td>
              </tr>
            `;
        })
        .join("")
    : "";

  const presentParticipants = (meeting.participants || []).filter((p) => p.joinedAt);
  const absentParticipants = (meeting.participants || []).filter((p) => !p.joinedAt);

  return `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>${title}</title>
      ${base ? `<base href="${escapeHtml(base)}/" />` : ""}
      <style>
        :root { --fg:#0b1220; --muted:#5b6b84; --border:#e5eaf3; --bg:#ffffff; --brand:#1d4ed8; }
        * { box-sizing: border-box; }
        html, body { padding: 0; margin: 0; background: var(--bg); }
        body { font-family: -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif; color: var(--fg); }
        @page { size: A4; margin: 10mm 12mm 12mm 12mm; }
        .page { padding: 0; }
        h1 { margin: 0; font-size: 20px; letter-spacing: -0.02em; }
        .topbar { text-align: center; margin: 0 0 8px; padding: 0 0 8px; border-bottom: 1px solid var(--border); }
        .brand { font-weight: 800; font-size: 11px; letter-spacing: 0.18em; color: var(--muted); text-transform: uppercase; }
        .sub { color: var(--muted); margin-top: 4px; font-size: 11px; }
        .top-meta { margin-top: 6px; display:flex; justify-content:center; gap: 10px; flex-wrap:wrap; }
        .pill { border: 1px solid var(--border); background: #f8fafc; color: var(--fg); padding: 4px 10px; border-radius: 999px; font-size: 10.5px; font-weight: 700; }
        .card { border: 1px solid var(--border); border-radius: 12px; padding: 11px 12px; margin-bottom: 10px; break-inside: avoid; }
        .card.action-items { break-inside: auto; }
        .label { color: var(--muted); font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 6px; }
        .value { font-size: 13px; line-height: 1.42; white-space: pre-wrap; }
        .chips { display:flex; flex-wrap:wrap; gap:6px; }
        .chip { border:1px solid var(--border); border-radius:999px; padding:3px 9px; font-size:11px; color: var(--fg); background:#f8fafc; }
        .images { display:grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
        .img { border:1px solid var(--border); border-radius: 10px; overflow:hidden; background:#fff; }
        .img img { width:100%; height:auto; display:block; }
        .imgcap { padding:8px 10px; font-size: 11px; color: var(--muted); border-top:1px solid var(--border); }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th, td { border-top: 1px solid var(--border); padding: 8px 6px; text-align: left; vertical-align: top; }
        th { color: var(--muted); font-weight: 600; }
        .muted { color: var(--muted); }
        .badge { display:inline-block; padding:2px 8px; border-radius:999px; font-size:12px; border:1px solid var(--border); }
        .badge.pending { background:#fff7ed; border-color:#fed7aa; color:#9a3412; }
        .badge.done { background:#ecfdf5; border-color:#a7f3d0; color:#065f46; }
        .badge.late { background:#eff6ff; border-color:#bfdbfe; color:#1d4ed8; }
        .section-title { font-size: 11px; font-weight: 900; letter-spacing: 0.16em; text-transform: uppercase; color: var(--muted); margin: 0 0 8px; }
        .footer { margin-top: 6px; padding-top: 8px; border-top: 1px solid var(--border); color: var(--muted); font-size: 10px; display:flex; justify-content:space-between; }
        .prose { font-size: 12.5px; line-height: 1.5; }
        .prose p { margin: 0 0 10px; }
        .prose h1, .prose h2, .prose h3 { margin: 14px 0 8px; }
        .prose ul, .prose ol { margin: 6px 0 10px 20px; padding: 0; }
      </style>
    </head>
    <body>
      <div class="page">
      <div class="topbar">
        <div class="brand">GT MOM • Minutes of Meeting</div>
        <h1 style="margin-top:4px;">${title}</h1>
        <div class="sub">${escapeHtml(date)} • ${escapeHtml(timeRange)}</div>
        <div class="top-meta">
          <span class="pill">Status: ${escapeHtml(mom?.docStatus || "draft")}</span>
        </div>
      </div>

      <div class="card">
        <div class="section-title">Agenda</div>
        <div class="value">${agenda}</div>
      </div>

      <div class="card">
        <div class="section-title">Attendance</div>
        <div class="chips" style="margin-bottom: 12px;">
          <span class="chip">Total Invited: ${meeting.participants?.length || 0}</span>
          <span class="chip" style="background:#ecfdf5; border-color:#a7f3d0; color:#065f46;">Present: ${presentParticipants.length}</span>
          <span class="chip" style="background:#fef2f2; border-color:#fecaca; color:#991b1b;">Absent: ${absentParticipants.length}</span>
        </div>
        <div class="label">Present</div>
        <div class="chips" style="margin-bottom: 12px;">
          ${(presentParticipants.length ? presentParticipants : [null]).map((p) => {
            if (!p) return `<span class="chip muted">—</span>`;
            return `<span class="chip" style="border-color:#c7d2fe; background:#eef2ff;">${escapeHtml(p.name || p.email)}</span>`;
          }).join("")}
        </div>

        <div class="label">Absent</div>
        <div class="chips" style="margin-bottom: 12px;">
          ${(absentParticipants.length ? absentParticipants : [null]).map((p) => {
            if (!p) return `<span class="chip muted">—</span>`;
            return `<span class="chip" style="border-color:#fecaca; background:#fef2f2;">${escapeHtml(p.name || p.email)}</span>`;
          }).join("")}
        </div>

        <div class="label">Participants Detail</div>
        <table>
          <thead>
            <tr>
              <th>Name / Email</th>
              <th>Status</th>
              <th>Join Time</th>
              <th>Leave Time</th>
              <th>Duration</th>
            </tr>
          </thead>
          <tbody>
            ${(meeting.participants || []).map(p => {
              const joinValue = p.joinedAt || p.lastJoinedAt;
              const leaveValue = p.leftAt;
              const joinT = joinValue ? new Date(joinValue).getTime() : 0;
              const leaveT = leaveValue ? new Date(leaveValue).getTime() : 0;
              
              let duration = '—';
              if (joinT) {
                if (leaveT && leaveT >= joinT) {
                  const mins = Math.round((leaveT - joinT) / 60000);
                  duration = mins > 0 ? (mins + " min") : '< 1 min';
                } else if (meeting.status === 'ongoing' || meeting.status === 'scheduled') {
                  duration = 'Ongoing';
                } else if (meeting.actualEndTime) {
                  const endT = new Date(meeting.actualEndTime).getTime();
                  const mins = Math.round((endT - joinT) / 60000);
                  duration = mins > 0 ? (mins + " min") : '< 1 min';
                }
              }

              const isPresent = Boolean(joinT);
              const statusLabel = isPresent ? 'Present' : 'Absent';
              const badgeClass = isPresent ? 'done' : 'pending';
              
              return `
              <tr>
                <td>${escapeHtml(p.name || p.email)}${p.email && p.name ? `<div class="muted" style="font-size:11px; margin-top:2px;">${escapeHtml(p.email)}</div>` : ""}</td>
                <td><span class="badge ${badgeClass}">${statusLabel}</span></td>
                <td>${joinT ? `Join at ${formatTime(joinValue)}` : '—'}</td>
                <td>${joinT ? (leaveT ? `Leave at ${formatTime(leaveValue)}` : (meeting.status === 'completed' ? `End at ${formatTime(meeting.actualEndTime || meeting.endTime)}` : '—')) : '—'}</td>
                <td>${duration}</td>
              </tr>
            `}).join('')}
          </tbody>
        </table>
      </div>

      <div class="card">
        <div class="section-title">Summary</div>
        <div class="value">${summary}</div>
      </div>

      <div class="card">
        <div class="section-title">Minutes</div>
        <div class="prose">
          ${mom?.contentHtml || '<span class="muted">No minutes were recorded.</span>'}
        </div>
      </div>

      <div class="card">
        <div class="section-title">Decisions</div>
        <div class="value">${decisions}</div>
      </div>

      <div class="card action-items">
        <div class="section-title">Action Items</div>
        ${actionItems.length ? `
          <table>
            <thead>
              <tr>
                <th style="width:40%;">Task</th>
                <th style="width:25%;">Assigned To</th>
                <th style="width:20%;">Deadline</th>
                <th style="width:15%;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${actionItemsRowsHtml}
            </tbody>
          </table>
        ` : `<div class="muted" style="font-size:12px;">No action items</div>`}
      </div>

      <div class="footer">
        <div>Generated on ${escapeHtml(new Date().toLocaleString())}</div>
        <div>Confidential • Internal Use Only</div>
      </div>
      </div>
    </body>
  </html>`;
}

module.exports = { buildMomHtml };

