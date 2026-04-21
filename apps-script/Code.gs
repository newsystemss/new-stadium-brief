// New Stadium Brief Submission Handler
// Paste this into Google Apps Script (Extensions > Apps Script from your Sheet)
// Then deploy as Web App (Deploy > New deployment > Web app > Execute as: Me, Access: Anyone)

const TEAM_EMAIL = 'stadium@newsystems.ca';
const SHEET_NAME = 'Submissions';
const FORM_TOKEN = 'ns-brief-2026';
const MAX_FIELD_LEN = 5000;
const MAX_SUBMISSIONS_PER_HOUR = 50;
const EMAIL_COOLDOWN_MS = 300000; // 5 minutes per email address
const STATUS_COLUMN = 21; // 1-indexed column for Status flag (see setupSheet)

function doPost(e) {
  try {
    console.log('doPost: start');
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

    console.log('doPost: validation passed for ' + data.email);

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

    console.log('doPost: appending sheet row, id=' + submissionId);

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
      data.company || '',
      data.referral || '',
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
    const rowIndex = sheet.getLastRow();
    console.log('doPost: sheet append complete, row=' + rowIndex);

    // Stamp rate limits now that the submission is safely stored.
    // Earlier failures (hangs, validation errors) do not lock the user out.
    stampEmailRateLimit(data.email);
    incrementGlobalCounter();

    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheetRowUrl = 'https://docs.google.com/spreadsheets/d/' + spreadsheet.getId()
      + '/edit#gid=' + sheet.getSheetId() + '&range=A' + rowIndex;

    // SECURITY: Confirmation email stays plain text. Team email is HTML, but
    // every user-controlled field is passed through escapeHtml() before interpolation.

    const emailFailures = [];

    console.log('doPost: sending confirmation email');
    try {
      sendConfirmationEmail(data);
      console.log('doPost: confirmation email sent');
    } catch (emailErr) {
      console.error('confirmation email failed: ' + emailErr.message);
      emailFailures.push('confirmation');
    }

    console.log('doPost: sending team notification');
    try {
      sendTeamNotification(data, submissionId, timestamp, sheetRowUrl);
      console.log('doPost: team notification sent');
    } catch (emailErr) {
      console.error('team notification failed: ' + emailErr.message);
      emailFailures.push('team');
    }

    // Flag failed emails in Status column for manual follow-up
    if (emailFailures.length > 0) {
      try {
        sheet.getRange(rowIndex, STATUS_COLUMN).setValue('EMAIL_FAILED: ' + emailFailures.join(', '));
      } catch (statusErr) {
        console.error('failed to write status flag: ' + statusErr.message);
      }
    }

    console.log('doPost: complete');
    return respond({ success: true, id: submissionId });

  } catch (err) {
    console.error('doPost exception: ' + err.message);
    return respond({ error: err.message });
  }
}

function respond(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// Rate limiting: per email address. Check and stamp are separate so a failed
// submission (hang, validation error) does not lock the user out of retrying.
function isEmailRateLimited(email) {
  const props = PropertiesService.getScriptProperties();
  const key = 'rate_' + email.toLowerCase().replace(/[^a-z0-9@.]/g, '');
  const last = props.getProperty(key);
  if (last && (Date.now() - parseInt(last)) < EMAIL_COOLDOWN_MS) {
    return true;
  }
  return false;
}

function stampEmailRateLimit(email) {
  const props = PropertiesService.getScriptProperties();
  const key = 'rate_' + email.toLowerCase().replace(/[^a-z0-9@.]/g, '');
  props.setProperty(key, Date.now().toString());
}

// Rate limiting: global per hour. Check and increment are separate so invalid
// or rejected requests do not consume the quota.
function isGlobalRateLimited() {
  const props = PropertiesService.getScriptProperties();
  const resetTime = parseInt(props.getProperty('global_reset') || '0');
  if (Date.now() - resetTime > 3600000) return false;
  const count = parseInt(props.getProperty('global_count') || '0');
  return count >= MAX_SUBMISSIONS_PER_HOUR;
}

function incrementGlobalCounter() {
  const props = PropertiesService.getScriptProperties();
  const now = Date.now();
  const resetTime = parseInt(props.getProperty('global_reset') || '0');
  if (now - resetTime > 3600000) {
    props.setProperty('global_count', '1');
    props.setProperty('global_reset', now.toString());
  } else {
    const count = parseInt(props.getProperty('global_count') || '0') + 1;
    props.setProperty('global_count', count.toString());
  }
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

function escapeHtml(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeHtmlMultiline(s) {
  return escapeHtml(s).replace(/\n/g, '<br>');
}

function sendTeamNotification(data, submissionId, timestamp, sheetRowUrl) {
  // Sanitize name for subject line
  const safeName = (data.firstName || '').replace(/[\r\n]/g, '').substring(0, 50)
    + ' ' + (data.lastName || '').replace(/[\r\n]/g, '').substring(0, 50);
  const subject = 'New Brief: ' + safeName.trim();

  const dateStr = timestamp.toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' });
  const idHtml = sheetRowUrl
    ? '<a href="' + escapeHtml(sheetRowUrl) + '">' + escapeHtml(submissionId) + '</a>'
    : escapeHtml(submissionId);

  const parts = [];
  parts.push('<div style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.5;">');
  parts.push('<p><strong>Submission ID:</strong> ' + idHtml + '<br>');
  parts.push('<strong>Date:</strong> ' + escapeHtml(dateStr) + '</p>');
  parts.push('<hr>');
  parts.push('<p><strong>Contact</strong></p>');
  parts.push('<p>');
  parts.push('<strong>Name:</strong> ' + escapeHtml((data.firstName || '') + ' ' + (data.lastName || '')));
  parts.push('<br><strong>Email:</strong> ' + escapeHtml(data.email));
  if (data.phone) parts.push('<br><strong>Phone:</strong> ' + escapeHtml(data.phone));
  if (data.twitter) parts.push('<br><strong>Twitter:</strong> @' + escapeHtml(data.twitter));
  if (data.instagram) parts.push('<br><strong>Instagram:</strong> @' + escapeHtml(data.instagram));
  if (data.website) parts.push('<br><strong>Website:</strong> ' + escapeHtml(data.website));
  if (data.company) parts.push('<br><strong>Company/Organization:</strong> ' + escapeHtml(data.company));
  if (data.referral) parts.push('<br><strong>Referred via:</strong> ' + escapeHtml(data.referral));
  parts.push('</p>');
  parts.push('<hr>');
  parts.push('<p><strong>Event Brief</strong></p>');
  parts.push('<p><strong>1. Event Idea:</strong><br>' + escapeHtmlMultiline(data.idea) + '</p>');
  parts.push('<p><strong>2. Mission Alignment:</strong><br>' + escapeHtmlMultiline(data.alignment) + '</p>');
  parts.push('<p><strong>3. Spatial Requirements:</strong><br>' + escapeHtmlMultiline(data.spatial) + '</p>');
  parts.push('<p><strong>4. Ideal Attendees:</strong> ' + escapeHtml(data.attendees) + '</p>');
  parts.push('<p><strong>5. Takeaway:</strong><br>' + escapeHtmlMultiline(data.takeaway) + '</p>');
  parts.push('<p><strong>6. Budget:</strong> ' + escapeHtml(data.budget) + '</p>');
  parts.push('<p><strong>7. Ideal Date:</strong> ' + escapeHtml(data.idealDate) + '</p>');
  parts.push('<p><strong>8. Timeframe:</strong><br>' + escapeHtmlMultiline(data.runtime) + '</p>');
  parts.push('<hr>');
  parts.push('<p>View all submissions in the Google Sheet.</p>');
  parts.push('</div>');

  const htmlBody = parts.join('\n');

  // Plain-text fallback for clients that don't render HTML.
  const plainBody = [
    'Submission ID: ' + submissionId,
    sheetRowUrl ? 'Sheet row: ' + sheetRowUrl : null,
    'Date: ' + dateStr,
    '',
    '--- Contact ---',
    'Name: ' + (data.firstName || '') + ' ' + (data.lastName || ''),
    'Email: ' + data.email,
    data.phone ? 'Phone: ' + data.phone : null,
    data.twitter ? 'Twitter: @' + data.twitter : null,
    data.instagram ? 'Instagram: @' + data.instagram : null,
    data.website ? 'Website: ' + data.website : null,
    data.company ? 'Company/Organization: ' + data.company : null,
    data.referral ? 'Referred via: ' + data.referral : null,
    '',
    '--- Event Brief ---',
    '1. Event Idea:', data.idea, '',
    '2. Mission Alignment:', data.alignment, '',
    '3. Spatial Requirements:', data.spatial, '',
    '4. Ideal Attendees: ' + data.attendees, '',
    '5. Takeaway:', data.takeaway, '',
    '6. Budget: ' + data.budget, '',
    '7. Ideal Date: ' + data.idealDate, '',
    '8. Timeframe:', data.runtime
  ].filter(function(line) { return line !== null; }).join('\n');

  GmailApp.sendEmail(TEAM_EMAIL, subject, plainBody, {
    name: 'New Stadium Brief Form',
    htmlBody: htmlBody
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
  sheet.getRange(1, 1, 1, 23).setValues([[
    'Timestamp',
    'Submission ID',
    'First Name',
    'Last Name',
    'Email',
    'Phone',
    'Twitter',
    'Instagram',
    'Website',
    'Company/Organization',
    'Referral Source',
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
  sheet.getRange(1, 1, 1, 23).setFontWeight('bold');
  sheet.setFrozenRows(1);
}
