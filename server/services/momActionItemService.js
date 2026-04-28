const WEEKDAYS = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

function stripHtml(html) {
  return String(html || "")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function titleCase(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function nextWeekday(baseDate, weekdayIndex) {
  const base = new Date(baseDate);
  base.setHours(12, 0, 0, 0);
  const diff = (weekdayIndex - base.getDay() + 7) % 7 || 7;
  base.setDate(base.getDate() + diff);
  return base;
}

function parseDatePhrase(phrase, fallbackDate) {
  const text = String(phrase || "").trim().toLowerCase();
  if (!text) return null;

  const explicit = new Date(text);
  if (!Number.isNaN(explicit.getTime())) {
    explicit.setHours(12, 0, 0, 0);
    return explicit;
  }

  const base = fallbackDate ? new Date(fallbackDate) : new Date();
  base.setHours(12, 0, 0, 0);

  if (text === "today") return base;
  if (text === "tomorrow") {
    const tomorrow = new Date(base);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  }

  const weekdayIndex = WEEKDAYS[text];
  if (weekdayIndex !== undefined) {
    return nextWeekday(base, weekdayIndex);
  }

  const weekdayMatch = text.match(/next\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday)/);
  if (weekdayMatch) {
    return nextWeekday(base, WEEKDAYS[weekdayMatch[1]]);
  }

  const slashMatch = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (slashMatch) {
    const [, day, month, year] = slashMatch;
    const fullYear = year.length === 2 ? `20${year}` : year;
    const parsed = new Date(Number(fullYear), Number(month) - 1, Number(day), 12, 0, 0, 0);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  return null;
}

function normalizeManualItems(items) {
  return (Array.isArray(items) ? items : [])
    .map((item) => ({
      title: titleCase(item?.title || item?.task || ""),
      task: titleCase(item?.task || item?.title || ""),
      assignedTo: String(item?.assignedTo || "").trim(),
      deadline: item?.deadline ? new Date(item.deadline) : null,
      status: item?.status === "completed" || item?.status === "done" ? "completed" : "pending",
    }))
    .filter((item) => item.task || item.assignedTo || item.deadline);
}

function extractActionItemsFromHtml({ contentHtml, fallbackDate }) {
  const text = stripHtml(contentHtml);
  if (!text) return [];

  const sentences = text
    .split(/[\n.!?]+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  const extracted = [];

  for (const sentence of sentences) {
    const match = sentence.match(
      /^\s*["']?([A-Za-z][A-Za-z.\- ]{1,50})["']?\s+will\s+(.+?)(?:\s+(?:by|before|on)\s+([A-Za-z0-9,\-/ ]+))?\s*["']?[.!?]?["']?\s*$/i
    );

    if (!match) continue;

    const [, assignee, rawTask, rawDeadline] = match;
    const cleanedTask = rawTask
      .replace(/^(be responsible for|need to|be able to)\s+/i, "")
      .replace(/\s+/g, " ")
      .trim();

    if (!cleanedTask) continue;

    extracted.push({
      title: titleCase(cleanedTask),
      task: titleCase(cleanedTask),
      assignedTo: assignee.trim(),
      deadline: parseDatePhrase(rawDeadline, fallbackDate),
      status: "pending",
    });
  }

  return extracted;
}

function mergeActionItems({ manualItems, generatedItems }) {
  const merged = [];
  const seen = new Set();

  for (const item of [...normalizeManualItems(manualItems), ...generatedItems]) {
    const key = [
      String(item.task || item.title || "").trim().toLowerCase(),
      String(item.assignedTo || "").trim().toLowerCase(),
      item.deadline ? new Date(item.deadline).toISOString().slice(0, 10) : "",
    ].join("|");

    if (!key.replace(/\|/g, "")) continue;
    if (seen.has(key)) continue;
    seen.add(key);

    merged.push({
      title: item.title || item.task,
      task: item.task || item.title,
      assignedTo: item.assignedTo || "",
      deadline: item.deadline || undefined,
      status: item.status === "completed" ? "completed" : "pending",
      priority: item.priority || "Medium",
    });
  }

  return merged;
}

module.exports = {
  extractActionItemsFromHtml,
  mergeActionItems,
  parseDatePhrase,
  stripHtml,
};
