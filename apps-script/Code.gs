// New Stadium Brief Submission Handler
// Paste this into Google Apps Script (Extensions > Apps Script from your Sheet)
// Then deploy as Web App (Deploy > New deployment > Web app > Execute as: Me, Access: Anyone)

const TEAM_EMAIL = 'stadium@newsystems.ca';
const SHEET_NAME = 'Submissions';
const FORM_TOKEN = 'ns-brief-2026';
const MAX_FIELD_LEN = 5000;
const MAX_SUBMISSIONS_PER_HOUR = 50;
const EMAIL_COOLDOWN_MS = 300000; // 5 minutes per email address

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    // CSRF token check
    if (!data._token || data._token !== FORM_TOKEN) {
      return respond({ error: 'Invalid request' });
    }

    // Global rate limit
    if (isGlobalRateLimited()) {
      return respond({ error: 'Too many submissions. Please try again later.' });
    }

    // Validate email format
    if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      return respond({ error: 'Invalid email address' });
    }

    // Per-email rate limit (prevents email bombing)
    if (isEmailRateLimited(data.email)) {
      return respond({ error: 'A submission from this email was recently received. Please wait a few minutes.' });
    }

    // Validate required fields
    const required = ['firstName', 'lastName', 'email', 'idea', 'alignment', 'spatial', 'attendees', 'takeaway', 'idealDate', 'runtime'];
    for (const field of required) {
      if (!data[field] || !String(data[field]).trim()) {
        return respond({ error: 'Missing required field: ' + field });
      }
    }

    // Sanitize and truncate all string fields
    for (const key of Object.keys(data)) {
      if (typeof data[key] === 'string') {
        data[key] = data[key].substring(0, MAX_FIELD_LEN).replace(/[\r]/g, '');
      }
    }

    // Remove the token from data before storing
    delete data._token;

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    if (!sheet) {
      return respond({ error: 'Sheet not found' });
    }

    // Check sheet capacity
    if (sheet.getLastRow() >= 400000) {
      return respond({ error: 'Submission storage is full. Please email stadium@newsystems.ca directly.' });
    }

    // Generate submission ID and timestamp
    const timestamp = new Date();
    const submissionId = 'NS-' + timestamp.getTime().toString(36).toUpperCase();

    // Append row to sheet
    sheet.appendRow([
      timestamp,
      submissionId,
      data.firstName || '',
      data.lastName || '',
      data.email || '',
      data.phone || '',
      data.twitter || '',
      data.instagram || '',
      data.website || '',
      data.idea || '',
      data.alignment || '',
      data.spatial || '',
      data.attendees || '',
      data.takeaway || '',
      data.budget || '',
      data.openToTrade || '',
      data.idealDate || '',
      data.runtime || '',
      '', // Status
      '', // Notes
      'brief.newsystems.ca'
    ]);

    // SECURITY: These emails MUST remain plain text (not htmlBody).
    // User input is interpolated without HTML escaping.
    // Converting to HTML emails requires escaping all user data first.

    sendConfirmationEmail(data);
    sendTeamNotification(data, submissionId, timestamp);

    return respond({ success: true, id: submissionId });

  } catch (err) {
    return respond({ error: err.message });
  }
}

function respond(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// Rate limiting: per email address
function isEmailRateLimited(email) {
  const props = PropertiesService.getScriptProperties();
  const key = 'rate_' + email.toLowerCase().replace(/[^a-z0-9@.]/g, '');
  const last = props.getProperty(key);
  const now = Date.now();
  if (last && (now - parseInt(last)) < EMAIL_COOLDOWN_MS) {
    return true;
  }
  props.setProperty(key, now.toString());
  return false;
}

// Rate limiting: global per hour
function isGlobalRateLimited() {
  const props = PropertiesService.getScriptProperties();
  const countKey = 'global_count';
  const resetKey = 'global_reset';
  const now = Date.now();
  const resetTime = parseInt(props.getProperty(resetKey) || '0');

  if (now - resetTime > 3600000) {
    props.setProperty(countKey, '1');
    props.setProperty(resetKey, now.toString());
    return false;
  }

  const count = parseInt(props.getProperty(countKey) || '0') + 1;
  props.setProperty(countKey, count.toString());
  return count > MAX_SUBMISSIONS_PER_HOUR;
}

function sendConfirmationEmail(data) {
  if (!data.email) return;

  const subject = 'New Stadium: Brief Received';
  const body = [
    'A confirmation has been sent to your email.',
    '',
    'If your event/project is a fit, we will connect with you within a week to follow up with next steps.',
    '',
    'If you have any further questions, please email stadium@newsystems.ca',
    '',
    'Thank you for everything.',
    '',
    'New'
  ].join('\n');

  GmailApp.sendEmail(data.email, subject, body, {
    name: 'New Stadium',
    replyTo: TEAM_EMAIL
  });
}

function sendTeamNotification(data, submissionId, timestamp) {
  // Sanitize name for subject line
  const safeName = (data.firstName || '').replace(/[\r\n]/g, '').substring(0, 50)
    + ' ' + (data.lastName || '').replace(/[\r\n]/g, '').substring(0, 50);
  const subject = 'New Brief: ' + safeName.trim();

  const body = [
    'New brief submission received.',
    '',
    '---',
    '',
    'Submission ID: ' + submissionId,
    'Date: ' + timestamp.toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' }),
    '',
    '--- Contact ---',
    '',
    'Name: ' + data.firstName + ' ' + data.lastName,
    'Email: ' + data.email,
    data.phone ? 'Phone: ' + data.phone : null,
    data.twitter ? 'Twitter: @' + data.twitter : null,
    data.instagram ? 'Instagram: @' + data.instagram : null,
    data.website ? 'Website: ' + data.website : null,
    '',
    '--- Event Brief ---',
    '',
    '1. Event Idea:',
    data.idea,
    '',
    '2. Mission Alignment:',
    data.alignment,
    '',
    '3. Spatial Requirements:',
    data.spatial,
    '',
    '4. Ideal Attendees: ' + data.attendees,
    '',
    '5. Takeaway:',
    data.takeaway,
    '',
    '6. Budget: ' + data.budget,
    data.budget === 'No' && data.openToTrade ? '   Open to trade: ' + data.openToTrade : null,
    '',
    '7. Ideal Date: ' + data.idealDate,
    '',
    '8. Timeframe:',
    data.runtime,
    '',
    '---',
    '',
    'View all submissions in the Google Sheet.'
  ].filter(function(line) { return line !== null; }).join('\n');

  GmailApp.sendEmail(TEAM_EMAIL, subject, body, {
    name: 'New Stadium Brief Form'
  });
}

function doGet() {
  return ContentService.createTextOutput('Brief submission endpoint is active.')
    .setMimeType(ContentService.MimeType.TEXT);
}

// Run this once to set up the sheet headers
function setupSheet() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  sheet.setName(SHEET_NAME);
  sheet.getRange(1, 1, 1, 21).setValues([[
    'Timestamp',
    'Submission ID',
    'First Name',
    'Last Name',
    'Email',
    'Phone',
    'Twitter',
    'Instagram',
    'Website',
    'Event Idea',
    'Mission Alignment',
    'Spatial Requirements',
    'Attendees',
    'Takeaway',
    'Budget',
    'Open to Trade',
    'Ideal Date',
    'Timeframe',
    'Status',
    'Notes',
    'Source'
  ]]);
  sheet.getRange(1, 1, 1, 21).setFontWeight('bold');
  sheet.setFrozenRows(1);
}
