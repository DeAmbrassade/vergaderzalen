# Vergaderzalen Overzicht

A single-page display board showing today's meetings across 7 meeting rooms, designed to run on a Yodeck player.

## How it works

- A Netlify Function (`netlify/functions/meetings.mts`) fetches the Outlook/Office365 ICS calendar feed for each meeting room, parses today's events (including recurring events) with `node-ical`, and returns them as one chronologically sorted JSON list at `/api/meetings`.
- The static page (`public/index.html`) polls that endpoint every 2 minutes and renders the list. Each row shows the time, the meeting room name, and the meeting title, with a background color matching its room.

## Tech stack

- Static HTML/CSS/vanilla JS frontend (no build step)
- Netlify Functions (TypeScript, `.mts`)
- `node-ical` for ICS parsing

## Running locally

```bash
npm install
netlify dev --port 8889
```

Then open `http://localhost:8889`.
