// Constants
const HOURS_IN_YEAR = 8760; // 365 * 24
const HOURS_IN_LEAP_YEAR = 8784; // 366 * 24
const YEARS_TO_GENERATE = 10;

// State
let eventData = {
    email1: '',
    email2: '',
    events: [] // Array of {year, date1, date2}
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Event listeners
    document.getElementById('scheduleForm').addEventListener('submit', (e) => {
        e.preventDefault();
        generateSchedule();
    });
    document.getElementById('downloadICS').addEventListener('click', downloadAllICS);
});

async function generateSchedule() {
    const email1 = document.getElementById('email1').value.trim().toLowerCase();
    const email2 = document.getElementById('email2').value.trim().toLowerCase();

    // Validation
    if (!email1 || !email2) {
        alert('Please enter both email addresses');
        return;
    }

    if (!isValidEmail(email1) || !isValidEmail(email2)) {
        alert('Please enter valid email addresses');
        return;
    }

    // Store in state
    eventData.email1 = email1;
    eventData.email2 = email2;
    eventData.events = [];

    // Generate events for the next 10 years
    const currentYear = new Date().getFullYear();

    for (let i = 0; i < YEARS_TO_GENERATE; i++) {
        const year = currentYear + i;

        // Generate the two random hours for this year using native crypto
        const hash1 = await hashString(email1 + email2 + year);
        const hash2 = await hashString(email2 + email1 + year);

        const hoursInYear = isLeapYear(year) ? HOURS_IN_LEAP_YEAR : HOURS_IN_YEAR;

        const hourOfYear1 = hashToNumber(hash1) % hoursInYear;
        const hourOfYear2 = hashToNumber(hash2) % hoursInYear;

        // Convert hour of year to datetime
        const date1 = hourOfYearToDate(hourOfYear1, year);
        const date2 = hourOfYearToDate(hourOfYear2, year);

        // Sort dates chronologically
        const sortedDates = [date1, date2].sort((a, b) => a - b);

        eventData.events.push({ year, date1: sortedDates[0], date2: sortedDates[1] });
    }

    // Display results
    displayResults();
}

async function hashString(str) {
    // Convert string to Uint8Array
    const encoder = new TextEncoder();
    const data = encoder.encode(str);

    // Hash using SHA-256 (native Web Crypto API)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);

    // Convert to hex string
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    return hashHex;
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isLeapYear(year) {
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

function hashToNumber(hash) {
    // Convert first 8 characters of hex hash to a number
    return parseInt(hash.substring(0, 8), 16);
}

function hourOfYearToDate(hourOfYear, year) {
    const startOfYear = new Date(Date.UTC(year, 0, 1, 0, 0, 0));
    const milliseconds = hourOfYear * 60 * 60 * 1000;
    return new Date(startOfYear.getTime() + milliseconds);
}

function formatDateTime(date) {
    const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'UTC',
        timeZoneName: 'short'
    };
    return date.toLocaleString('en-US', options);
}

function displayResults() {
    // Show results section
    document.getElementById('results').classList.remove('hidden');

    // Display all events
    const eventsList = document.getElementById('eventsList');
    eventsList.innerHTML = '';

    eventData.events.forEach((eventYear) => {
        const yearDiv = document.createElement('div');
        yearDiv.className = 'year-group';

        const yearHeader = document.createElement('h3');
        yearHeader.textContent = eventYear.year;
        yearDiv.appendChild(yearHeader);

        const eventsContainer = document.createElement('div');
        eventsContainer.className = 'event-details';

        const event1 = document.createElement('div');
        event1.className = 'event';
        const googleUrl1 = createGoogleCalendarUrl(eventYear.date1, eventYear.year);
        event1.innerHTML = `
            <h4>First Catchup</h4>
            <p class="event-time">${formatDateTime(eventYear.date1)}</p>
            <a href="${googleUrl1}" target="_blank" class="google-cal-link">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                    <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z"/>
                </svg>
                Add to Google Calendar
            </a>
        `;

        const event2 = document.createElement('div');
        event2.className = 'event';
        const googleUrl2 = createGoogleCalendarUrl(eventYear.date2, eventYear.year);
        event2.innerHTML = `
            <h4>Second Catchup</h4>
            <p class="event-time">${formatDateTime(eventYear.date2)}</p>
            <a href="${googleUrl2}" target="_blank" class="google-cal-link">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                    <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z"/>
                </svg>
                Add to Google Calendar
            </a>
        `;

        eventsContainer.appendChild(event1);
        eventsContainer.appendChild(event2);
        yearDiv.appendChild(eventsContainer);

        eventsList.appendChild(yearDiv);
    });

    // Scroll to results
    document.getElementById('results').scrollIntoView({ behavior: 'smooth' });
}

function formatDateForGoogle(date) {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

function formatDateForICS(date) {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

function downloadAllICS() {
    const icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//6 Month Catchup//Random Scheduler//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:REQUEST'
    ];

    const now = formatDateForICS(new Date());

    // Extract usernames from emails
    const email1Username = eventData.email1.split('@')[0];
    const email2Username = eventData.email2.split('@')[0];
    const eventTitle = `Random Catchup - ${email1Username} <> ${email2Username}`;

    // Add all events (2 per year for 10 years = 20 events)
    let eventCounter = 1;
    eventData.events.forEach((yearData) => {
        // First event of the year
        const startTime1 = formatDateForICS(yearData.date1);
        const endTime1 = formatDateForICS(new Date(yearData.date1.getTime() + 60 * 60 * 1000));

        icsContent.push(
            'BEGIN:VEVENT',
            `DTSTART:${startTime1}`,
            `DTEND:${endTime1}`,
            `DTSTAMP:${now}`,
            `UID:${Date.now()}-${eventCounter}@6monthcatchup.github.io`,
            `ORGANIZER:mailto:${eventData.email1}`,
            `SUMMARY:${eventTitle}`,
            `DESCRIPTION:Random catch-up call for ${yearData.year}\\n\\nScheduled via 6monthcatchup - two random times per year to catch up!\\n\\nParticipants:\\n${eventData.email1}\\n${eventData.email2}\\n\\nHow you connect is up to you - video call\\, phone\\, coffee\\, etc.`,
            `ATTENDEE;ROLE=REQ-PARTICIPANT;PARTSTAT=ACCEPTED;RSVP=FALSE:mailto:${eventData.email1}`,
            `ATTENDEE;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE:mailto:${eventData.email2}`,
            'STATUS:CONFIRMED',
            'SEQUENCE:0',
            'END:VEVENT'
        );
        eventCounter++;

        // Second event of the year
        const startTime2 = formatDateForICS(yearData.date2);
        const endTime2 = formatDateForICS(new Date(yearData.date2.getTime() + 60 * 60 * 1000));

        icsContent.push(
            'BEGIN:VEVENT',
            `DTSTART:${startTime2}`,
            `DTEND:${endTime2}`,
            `DTSTAMP:${now}`,
            `UID:${Date.now()}-${eventCounter}@6monthcatchup.github.io`,
            `ORGANIZER:mailto:${eventData.email1}`,
            `SUMMARY:${eventTitle}`,
            `DESCRIPTION:Random catch-up call for ${yearData.year}\\n\\nScheduled via 6monthcatchup - two random times per year to catch up!\\n\\nParticipants:\\n${eventData.email1}\\n${eventData.email2}\\n\\nHow you connect is up to you - video call\\, phone\\, coffee\\, etc.`,
            `ATTENDEE;ROLE=REQ-PARTICIPANT;PARTSTAT=ACCEPTED;RSVP=FALSE:mailto:${eventData.email1}`,
            `ATTENDEE;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE:mailto:${eventData.email2}`,
            'STATUS:CONFIRMED',
            'SEQUENCE:0',
            'END:VEVENT'
        );
        eventCounter++;
    });

    icsContent.push('END:VCALENDAR');

    const blob = new Blob([icsContent.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'random-catchup-10-years.ics';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function createGoogleCalendarUrl(date, year) {
    const startTime = formatDateForGoogle(date);
    const endTime = formatDateForGoogle(new Date(date.getTime() + 60 * 60 * 1000)); // 1 hour later

    // Extract usernames from emails
    const email1Username = eventData.email1.split('@')[0];
    const email2Username = eventData.email2.split('@')[0];
    const eventTitle = `Random Catchup - ${email1Username} <> ${email2Username}`;

    const description = `Random catch-up call for ${year}\n\nScheduled via 6monthcatchup - two random times per year to catch up!\n\nParticipants:\n${eventData.email1}\n${eventData.email2}\n\nHow you connect is up to you - video call, phone, coffee, etc.`;

    const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: eventTitle,
        dates: `${startTime}/${endTime}`,
        details: description,
        add: `${eventData.email1},${eventData.email2}`
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
