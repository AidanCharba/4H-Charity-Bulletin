# Nueces County 4-H Community Service Board — Google Sheets version

This version uses **GitHub Pages + Google Apps Script + a private Google Sheet**. No Firebase.

## 1. Create the Sheet
Create a Google Sheet named `Nueces County 4-H Service Board`.
Copy its ID from the URL:
`https://docs.google.com/spreadsheets/d/THIS_PART_IS_THE_ID/edit`

## 2. Add Apps Script
In the Sheet: Extensions -> Apps Script.
Replace the default code with `Code.gs`.
Set `SPREADSHEET_ID` to your Sheet ID and change `OPERATOR_KEY` to a long random secret.
Run `setup()` once and authorize it.

## 3. Deploy Apps Script
Deploy -> New deployment -> Web app.
Execute as: **Me**.
Who has access: **Anyone**.
Copy the Web app URL.

The spreadsheet stays private. The website communicates with Apps Script; visitors do not receive spreadsheet access.

## 4. Connect the GitHub site
Open `app.js` and replace:
`PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE`
with the Apps Script Web app URL.

Upload `index.html`, `style.css`, and `app.js` to a GitHub repository. Enable GitHub Pages from the main branch/root.

## Security notes
The operator key is not a perfect identity system. It is a shared secret. For a public production deployment, do not reuse it elsewhere and use a long random value. Participant contact details are stored in the private Sheet and are not displayed on the public event board.

For a stronger production authentication system, Google Apps Script can later be replaced with a proper backend while keeping the same front-end design.
