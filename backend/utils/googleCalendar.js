// backend/utils/googleCalendar.js
const { google } = require('googleapis');

async function createMeetLink(tokenString, startTime, endTime, clientEmail, coachEmail) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  // Load the coach's saved token
  oauth2Client.setCredentials(JSON.parse(tokenString));

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  const event = {
    summary: 'coach.gg 1-on-1 Session',
    description: 'Your coaching session is scheduled!',
    start: { dateTime: startTime },
    end: { dateTime: endTime },
    attendees: [{ email: clientEmail }, { email: coachEmail }],
    conferenceData: {
      createRequest: {
        requestId: Math.random().toString(36).substring(7), // Requires a unique random string
        conferenceSolutionKey: { type: 'hangoutsMeet' }
      }
    }
  };

  // Insert the event into the coach's primary calendar
  const response = await calendar.events.insert({
    calendarId: 'primary',
    resource: event,
    conferenceDataVersion: 1, // CRITICAL: This tells Google to generate the Meet link
    sendUpdates: 'all' // Sends an official Google Calendar email invite to both users
  });

  return response.data.hangoutLink; // Returns "https://meet.google.com/xxx-xxxx-xxx"
}

module.exports = { createMeetLink };