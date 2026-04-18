# Claude Code Project Guide: New Stadium Brief

## Overview

Custom brief submission form for New Stadium events. Static HTML/CSS/JS frontend posting to a Google Apps Script backend. Deployed at [brief.newsystems.ca](https://brief.newsystems.ca) via Netlify.

## Architecture

```
Browser (brief.newsystems.ca)
  |
  | POST (JSON, text/plain content-type)
  v
Google Apps Script (Web App)
  |
  |--- Append row to Google Sheet
  |--- Send confirmation email to submitter
  |--- Send notification email to stadium@newsystems.ca
```

No build step. No framework. Three files serve the entire frontend.

## Key Files

| File | Purpose | When to modify |
|------|---------|----------------|
| `index.html` | Form structure, field definitions, progress nav | Adding/removing/reordering questions |
| `style.css` | All styles, responsive breakpoints, animations | Visual changes, spacing, colors |
| `form.js` | Validation, step navigation, submission logic, textarea auto-expand | Changing form behavior, adding fields to payload |
| `apps-script/Code.gs` | Backend: Sheet append, email sending, rate limiting, validation | Changing email content, adding Sheet columns, adjusting rate limits |
| `netlify.toml` | Deploy config, security headers | Changing redirects or headers |
| `DESIGN-SYSTEM.md` | Design tokens for migrating newsystems.ca to match this form's aesthetic | Reference only |

## Adding a new form field

1. Add the HTML in `index.html` (inside the appropriate `form-step` section)
2. Add a `maxlength` attribute
3. In `form.js`, add the field to the `data` object in the submit handler
4. In `apps-script/Code.gs`:
   - Add the field to the `appendRow` call (maintain column order)
   - Add to `required` array if mandatory
   - Update the team notification email template
5. Run `setupSheet()` again or manually add the column header to the Sheet
6. Redeploy both the frontend (git push) and the Apps Script (paste + new version)

## Design System

- **Font:** Inter (weight 450 body, 500 headings, 14px base)
- **Colors:** `--bg: #fafafa`, `--text: #343c3c`, `--text-muted: #5e6666`, `--accent: #abb495`, `--error: #8b3a3a`
- **Layout:** Pinned top-left, max-width 560px, no centering
- **Inputs:** Bottom-border only, proportional widths (short 160px, medium 260px, long full-width textarea)
- **Buttons:** Styled as underlined text links, not boxed
- **Transitions:** 150ms ease fade between steps
- **Mobile breakpoint:** 600px (all inputs go full-width)

## Backend Details

- **Apps Script URL:** Hardcoded in `form.js` line 1
- **CSRF token:** `ns-brief-2026` (must match between `form.js` and `Code.gs`)
- **Rate limits:** 5 min cooldown per email, 50 submissions/hour global
- **Field truncation:** 5000 chars max per field (server-side)
- **Emails sent from:** email@newsystems.ca (the deploying account)
- **Google Sheet:** "New Stadium: Brief Submissions" in shared Drive

## Infrastructure

- **Netlify site:** stately-babka-f5fa60 (brief.newsystems.ca)
- **Netlify team:** New (fr0mn3w)
- **GitHub:** newsystemss/new-stadium-brief
- **Auto-deploy:** Pushes to `main` deploy automatically
- **DNS:** CNAME `brief` pointing to `stately-babka-f5fa60.netlify.app`

## Common Tasks

**Update form copy:** Edit `index.html`, commit, push.

**Update email templates:** Edit `apps-script/Code.gs`, copy contents, paste into Apps Script editor, Deploy > Manage deployments > Edit > New version > Deploy.

**Rotate CSRF token:** Change `FORM_TOKEN` in `Code.gs` and `_token` value in `form.js` data object. Redeploy both.

**Check submissions:** Open the Google Sheet directly, or check stadium@newsystems.ca inbox.

## Do NOT Modify

- The `setupSheet()` function column order without updating `appendRow` to match
- The `Content-Type: text/plain` header in the fetch call (prevents CORS preflight)
- Email format from plain text to HTML without adding input sanitization first

## Session Context

### 2026-04-12
Built the entire project from scratch in a single session. Started as a page in the Astro newsystems.ca site, scrapped that, rebuilt as standalone HTML/CSS/JS with a bare-bones aesthetic inspired by Hunor Karaman's site and Tommy's personal site (tommytrinh.me). Iterated through multiple design rounds: full-border inputs to bottom-border to proportional-width inputs with arrow navigation. Added Google Apps Script backend with rate limiting, CSRF protection, and email notifications. Deployed to Netlify at brief.newsystems.ca. Two QA/security audits performed and all findings addressed.

### Outstanding
- DNS "Pending DNS verification" on Netlify may need time to fully clear
- brief.newsystems.ca was showing an error page at session end (likely DNS propagation delay)
- The `DESIGN-SYSTEM.md` file can be used as a prompt to migrate the main newsystems.ca site to match this form's design system (Inter, new color palette, top-left layout)
