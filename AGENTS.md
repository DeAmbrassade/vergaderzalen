# AGENTS.md

## Architecture

- `public/index.html` — the entire frontend: markup, CSS, and vanilla JS in one file. No framework, no build step, since this is a single always-on display page for a Yodeck signage player.
- `netlify/functions/meetings.mts` — Netlify Function that fetches all 7 room ICS calendars server-side (avoids CORS, keeps calendar URLs out of client-side code), expands recurring events for today, flattens and sorts all meetings chronologically, and returns them as JSON.
- `netlify.toml` — sets `publish = "public"` and `functions = "netlify/functions"`.

## Key decisions

- Meeting room ICS URLs and their display colors are hardcoded in `meetings.mts` (`ROOMS` array). There are only 7 fixed rooms, so this is simpler than a database-backed config. To add/remove a room or change a color, edit that array.
- The function exposes a friendly route at `/api/meetings` via the function's `config.path`, rather than the default `/.netlify/functions/meetings` path.
- Recurring events are expanded manually using `node-ical`'s `rrule` plus `recurrences`/`exdate` overrides, since `node-ical` does not do "today's occurrences" expansion itself.
- The frontend polls `/api/meetings` every 2 minutes and re-renders the full list; there's no client-side calendar logic — all date/recurrence handling lives in the function.
- Past meetings (already ended) are dimmed (`.past` class) rather than removed, so the board still shows the day's full agenda at a glance.

## Conventions

- Netlify Functions use the modern `.mts` default-export + `config` format, not the older `handler` signature.
- No dependencies beyond `node-ical` and `@netlify/functions` — keep this minimal since it's a single-purpose display app.
