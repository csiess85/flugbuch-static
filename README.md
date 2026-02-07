# Flugbuch Manager

A static web application for managing a digital flight log and transferring entries into an offline paper logbook. Runs entirely in the browser — no server needed.

**Live:** [https://csiess85.github.io/flugbuch-static/](https://csiess85.github.io/flugbuch-static/)

## Features

- **Excel Import** — Upload your `Flugbuch.xlsx` directly in the browser (parsed client-side via SheetJS)
- **Per-flight assignment** — Set each flight to PIC or Dual, Tag or Nacht, and assign a logbook page
- **Automatic defaults** — New flights default to Dual + Tag, 10 flights per page
- **Page summaries** — Diese Seite / Uebertrag / Gesamt with Totale Flugzeit, Ldg Tag/Nacht, Blockzeit Nacht/PIC/Dual
- **Bulk editing** — Select multiple flights and change rolle, zeit, or page in one action
- **Persistence** — Assignments are saved in your browser's localStorage
- **Data export/import** — Download your data as JSON for backup or transfer between browsers
- **Three views** — Alle Fluege, Seiten-Ansicht, Nicht zugeordnet

## Usage

1. Open the app (via GitHub Pages link above or open `index.html` locally)
2. Click **Excel hochladen** and select your `Flugbuch.xlsx`
3. Assign flights to pages, set PIC/Dual and Tag/Nacht
4. Your changes are saved automatically in the browser

## Data Portability

- **Export:** Click "Daten exportieren" to download a `flugbuch_data.json` backup
- **Import:** Click "Daten importieren" to restore from a JSON backup
- **Re-upload Excel:** Uploading a new Excel preserves your existing rolle/zeit/seite assignments

## Privacy

All data stays in your browser. Nothing is sent to any server.
