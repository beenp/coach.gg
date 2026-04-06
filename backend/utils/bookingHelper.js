const { google } = require('googleapis');
const db = require('../db');
const { DateTime } = require('luxon');

async function getAvailableSlots(coachId, dateString) {
    const result = await db.query(`
    SELECT c.availability, c.timezone, u.gcal_token 
    FROM coaches c
    JOIN users u ON c.user_id = u.id
    WHERE c.id = $1
  `, [coachId]);

    if (result.rows.length === 0) throw new Error('Coach not found');

    const { availability, timezone, gcal_token } = result.rows[0];
    const coachTz = timezone || 'UTC';

    // 1. Create a DateTime object rooted in the COACH'S specific timezone
    const coachDate = DateTime.fromISO(dateString, { zone: coachTz });
    const dayOfWeek = coachDate.toFormat('EEEE').toLowerCase(); // e.g., 'monday'

    const daySchedule = availability[dayOfWeek];
    if (!daySchedule || !daySchedule.active) return [];

    // 2. Construct absolute Start and End times
    const [startHour, startMin] = daySchedule.start.split(':');
    const [endHour, endMin] = daySchedule.end.split(':');

    const startOfDay = coachDate.set({ hour: startHour, minute: startMin });
    const endOfDay = coachDate.set({ hour: endHour, minute: endMin });

    // Convert to pure UTC strings for Google Calendar
    const startIso = startOfDay.toUTC().toISO();
    const endIso = endOfDay.toUTC().toISO();

    let busyPeriods = [];
    if (gcal_token) {
        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET
        );
        oauth2Client.setCredentials(JSON.parse(gcal_token));
        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

        const freeBusyRes = await calendar.freebusy.query({
            requestBody: {
                timeMin: startIso,
                timeMax: endIso,
                items: [{ id: 'primary' }]
            }
        });
        busyPeriods = freeBusyRes.data.calendars.primary.busy;
    }

    const availableSlots = [];
    let currentSlot = startOfDay; // Luxon DateTime object

    while (currentSlot < endOfDay) {
        let slotEnd = currentSlot.plus({ hours: 1 });

        // Convert to native JS dates for math comparison
        const currentJsDate = currentSlot.toJSDate();
        const endJsDate = slotEnd.toJSDate();

        const isBusy = busyPeriods.some(busy => {
            const busyStart = new Date(busy.start);
            const busyEnd = new Date(busy.end);
            return (currentJsDate < busyEnd && endJsDate > busyStart);
        });

        if (!isBusy) {
            // Returns a globally absolute timestamp: "2026-04-07T14:00:00.000Z"
            availableSlots.push(currentSlot.toUTC().toISO());
        }

        currentSlot = slotEnd;
    }

    return availableSlots;
}

module.exports = { getAvailableSlots };