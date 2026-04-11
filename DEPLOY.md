# Deploy Instructions

## 1. Google Apps Script Setup

### Set up the Sheet
1. Open your Google Sheet (the one in the shared Drive)
2. Go to **Extensions > Apps Script**
3. Delete any existing code in the editor
4. Copy the entire contents of `apps-script/Code.gs` and paste it in
5. Save (Ctrl+S)

### Create the sheet headers
1. In the Apps Script editor, select `setupSheet` from the function dropdown (next to the play button)
2. Click the play button to run it
3. Google will ask for permissions. Click **Review Permissions > Advanced > Go to (project name) > Allow**
4. Go back to your Sheet. You should see "Submissions" tab with all column headers

### Deploy as Web App
1. In Apps Script, click **Deploy > New deployment**
2. Click the gear icon next to "Select type" and choose **Web app**
3. Settings:
   - Description: "Brief submission handler"
   - Execute as: **Me** (tommy@newsystems.ca)
   - Who has access: **Anyone**
4. Click **Deploy**
5. Copy the Web App URL (it looks like `https://script.google.com/macros/s/XXXX/exec`)

### Wire the URL into the form
1. Open `form.js`
2. Replace the empty string on line 1:
   ```js
   const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/YOUR_ID_HERE/exec';
   ```
3. Save

### Test it
1. Open the form locally, fill it out, submit
2. Check the Google Sheet for a new row
3. Check stadium@newsystems.ca for the team notification email
4. Check the submitter email for the confirmation

## 2. Netlify Deploy (brief.newsystems.ca)

### Create a new Netlify site
1. Go to https://app.netlify.com
2. Click **Add new site > Deploy manually**
3. Drag the `new-stadium-brief` folder into the upload area
4. The site will deploy with a random subdomain (e.g., silly-name-123.netlify.app)

### Set up custom domain
1. In the new site's settings, go to **Domain management > Add custom domain**
2. Enter `brief.newsystems.ca`
3. Since your DNS is managed through Netlify, it should auto-configure the CNAME record
4. If it asks, confirm the DNS record addition
5. Wait for SSL to provision (usually a few minutes)

### Verify
1. Visit https://brief.newsystems.ca
2. The form should load
3. Submit a test brief and verify the full flow (Sheet + emails)

## 3. Updating the form after deploy

Since this is a static site with manual deploy:
1. Make your changes to the files locally
2. Go to Netlify > your site > **Deploys**
3. Drag the updated `new-stadium-brief` folder to redeploy

Alternatively, connect the folder to a GitHub repo for automatic deploys on push.

## File structure
```
new-stadium-brief/
  index.html          # The form
  style.css           # Styles
  form.js             # Form logic + Apps Script URL
  netlify.toml        # Netlify config
  apps-script/
    Code.gs           # Google Apps Script (paste into Script editor)
  DESIGN-SYSTEM.md    # Design system reference
  DEPLOY.md           # This file
```
