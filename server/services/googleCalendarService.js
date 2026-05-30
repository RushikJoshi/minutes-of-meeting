const { google } = require("googleapis");
const IntegrationToken = require("../models/IntegrationToken");

const SCOPES = ["https://www.googleapis.com/auth/calendar.events", "https://www.googleapis.com/auth/userinfo.email"];

function getOAuth2Client() {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  const redirectUri = process.env.GOOGLE_REDIRECT_URI?.trim();

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("Missing Google OAuth environment variables");
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

/**
 * Generate Google Auth URL
 */
function getAuthUrl(state) {
  const oauth2Client = getOAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    state,
    prompt: "consent",
  });
}

/**
 * Exchange code for tokens and save to DB
 */
async function handleOAuthCallback({ code, userId, workspaceId, expectedEmail }) {
  const oauth2Client = getOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  
  oauth2Client.setCredentials(tokens);
  
  let accountEmail = "";
  try {
    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    accountEmail = userInfo.data.email || "";
  } catch (err) {
    console.error("Failed to get google user email:", err);
  }

  await IntegrationToken.findOneAndUpdate(
    { provider: "google", workspaceId, userId },
    {
      provider: "google",
      workspaceId,
      userId,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiryDate: tokens.expiry_date,
      accountEmail,
      connectedAt: new Date(),
    },
    { upsert: true, new: true }
  );

  return tokens;
}

/**
 * Get authenticated OAuth2 client for a specific user
 */
async function getAuthClientForUser(userId, workspaceId) {
  const doc = await IntegrationToken.findOne({ provider: "google", workspaceId, userId });
  if (!doc) return null;

  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({
    access_token: doc.accessToken,
    refresh_token: doc.refreshToken,
    expiry_date: doc.expiryDate,
  });

  // Handle token refresh
  oauth2Client.on("tokens", async (tokens) => {
    if (tokens.refresh_token) {
      doc.refreshToken = tokens.refresh_token;
    }
    doc.accessToken = tokens.access_token;
    doc.expiryDate = tokens.expiry_date;
    await doc.save();
  });

  return oauth2Client;
}

/**
 * Create Google Calendar event with Google Meet link
 */
async function createGoogleMeetEvent({ userId, meeting }) {
  const auth = await getAuthClientForUser(userId, meeting.workspaceId);
  if (!auth) return null;

  const calendar = google.calendar({ version: "v3", auth });

  const startDateTime = meeting.startTime ? new Date(meeting.startTime) : new Date(meeting.date);
  const endDateTime = meeting.endTime ? new Date(meeting.endTime) : new Date(startDateTime.getTime() + 60 * 60000);

  const event = {
    summary: meeting.title,
    description: meeting.agenda,
    start: {
      dateTime: startDateTime.toISOString(),
      timeZone: "Asia/Kolkata",
    },
    end: {
      dateTime: endDateTime.toISOString(),
      timeZone: "Asia/Kolkata",
    },
    conferenceData: {
      createRequest: {
        requestId: `meet-${meeting._id}-${Date.now()}`,
        conferenceSolutionKey: { type: "hangoutsMeet" },
      },
    },
    attendees: meeting.participants.map(p => ({ email: p.email })),
  };

  const response = await calendar.events.insert({
    calendarId: "primary",
    resource: event,
    conferenceDataVersion: 1,
  });

  return {
    eventId: response.data.id,
    meetLink: response.data.hangoutLink,
  };
}

/**
 * Update Google Calendar event
 */
async function updateGoogleMeetEvent({ userId, eventId, meeting }) {
  const auth = await getAuthClientForUser(userId, meeting.workspaceId);
  if (!auth) return null;

  const calendar = google.calendar({ version: "v3", auth });

  const startDateTime = meeting.startTime ? new Date(meeting.startTime) : new Date(meeting.date);
  const endDateTime = meeting.endTime ? new Date(meeting.endTime) : new Date(startDateTime.getTime() + 60 * 60000);

  const event = {
    summary: meeting.title,
    description: meeting.agenda,
    start: {
      dateTime: startDateTime.toISOString(),
      timeZone: meeting.timezone || "Asia/Kolkata",
    },
    end: {
      dateTime: endDateTime.toISOString(),
      timeZone: meeting.timezone || "Asia/Kolkata",
    },
    attendees: meeting.participants.map(p => ({ email: p.email })),
  };

  const response = await calendar.events.patch({
    calendarId: "primary",
    eventId,
    resource: event,
  });

  return {
    eventId: response.data.id,
    meetLink: response.data.hangoutLink,
  };
}

/**
 * Delete Google Calendar event
 */
async function deleteGoogleMeetEvent({ userId, workspaceId, eventId }) {
  const auth = await getAuthClientForUser(userId, workspaceId);
  if (!auth) return null;

  const calendar = google.calendar({ version: "v3", auth });

  await calendar.events.delete({
    calendarId: "primary",
    eventId,
  });

  return { ok: true };
}

module.exports = {
  getAuthUrl,
  handleOAuthCallback,
  getAuthClientForUser,
  createGoogleMeetEvent,
  updateGoogleMeetEvent,
  deleteGoogleMeetEvent,
};
