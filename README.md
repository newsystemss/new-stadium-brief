# New Stadium Brief Submission Form

A custom multi-step web form for collecting event and project briefs from people who want to host at [New Stadium](https://newsystems.ca/newstadium). Built as a standalone static site deployed at [brief.newsystems.ca](https://brief.newsystems.ca).

## How it works

1. Submitter fills out a 2-step form (Contact Info > Event Brief)
2. On submit, data posts to a Google Apps Script endpoint
3. The script appends a row to a Google Sheet, sends a confirmation email to the submitter, and sends a formatted notification to stadium@newsystems.ca
4. Submitter sees a confirmation screen

## Stack

- **Frontend:** Static HTML, CSS, JS (no framework, no build step)
- **Backend:** Google Apps Script (Web App deployment)
- **Data store:** Google Sheet (shared Drive, accessible by the New team)
- **Hosting:** Netlify, auto-deploys from `main` branch
- **Domain:** brief.newsystems.ca (CNAME to Netlify)
- **Font:** Inter via Google Fonts CDN

## File structure

```
new-stadium-brief/
  index.html          # The form (3 steps: Contact, Event Brief, Confirmation)
  style.css           # All styles (Inter, proportional inputs, mobile responsive)
  form.js             # Form logic (validation, navigation, submission, auto-expand textareas)
  netlify.toml        # Netlify deploy config + security headers
  apps-script/
    Code.gs           # Google Apps Script (paste into Script editor, not deployed from here)
  DESIGN-SYSTEM.md    # Design system reference for migrating newsystems.ca
  DEPLOY.md           # Step-by-step deploy instructions
  CLAUDE.md           # Claude Code project guide
  README.md           # This file
```

## Form fields

**Step 1: Contact Information**
- First name, Last name, Email (required)
- Twitter, Instagram, Personal website/portfolio, Phone (optional)

**Step 2: Event Brief (8 questions)**
1. Event/project idea
2. Mission alignment
3. Spatial requirements
4. Ideal attendees
5. Takeaway for attendees
6. Venue budget (Yes/No, with trade question if No)
7. Ideal date
8. Timeframe including setup and teardown

**Step 3: Confirmation**
- On-screen confirmation with email notice

## Google Sheet columns

Timestamp, Submission ID, First Name, Last Name, Email, Phone, Twitter, Instagram, Website, Event Idea, Mission Alignment, Spatial Requirements, Attendees, Takeaway, Budget, Open to Trade, Ideal Date, Timeframe, Status, Notes, Source

## Security

- CSRF token validation on the backend
- Per-email rate limiting (5 min cooldown)
- Global rate limiting (50 submissions/hour)
- Server-side input validation and field truncation (5000 char max)
- All frontend inputs have `maxlength` attributes
- Plain text emails only (no HTML injection surface)
- `noscript` fallback for JS-disabled browsers
- Netlify security headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy)

## Emails

Emails are sent from **email@newsystems.ca** (the account that deployed the Apps Script). The confirmation email reply-to is set to stadium@newsystems.ca.

- **To submitter:** Brief confirmation mirroring the on-screen text
- **To stadium@newsystems.ca:** Formatted summary with all submission data

## Making changes

1. Edit files locally
2. Commit and push to `main`
3. Netlify auto-deploys within seconds

To update the Apps Script backend:
1. Edit `apps-script/Code.gs` locally
2. Copy the contents
3. Paste into the Apps Script editor (Extensions > Apps Script from the Google Sheet)
4. Deploy > Manage deployments > Edit > New version > Deploy

## Team

- **Google Sheet owner:** email@newsystems.ca
- **Apps Script deployer:** email@newsystems.ca
- **Netlify team:** New (fr0mn3w)
- **GitHub org:** newsystemss
