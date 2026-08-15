# Toggl Focus — replica shell

A faithful React rebuild of the Toggl Focus (Toggl 2.0) web app, **dark theme only**, built to host a
prototype feature for the PM home assignment. Design tokens, icons, and illustrations were extracted
from the live app at `focus.toggl.com` on 2026-08-15 — not approximated by eye.

## Run

```bash
npm install && npm run dev
```

Then open http://localhost:5173 (redirects to `/calendar`).

## What's real vs. mocked

| Area | Status |
| --- | --- |
| Colour tokens, spacing, type scale | Extracted verbatim from the live app's CSS custom properties |
| Icons | Real SVG paths lifted from the app's DOM (`src/icons.tsx`) |
| Illustrations | Downloaded from `assets.focus.toggl.com` (`src/assets/`) |
| Data | Mocked in `src/data.ts` — a plausible week for one person |
| Backend | None. State lives in React (`src/store.tsx`) and resets on reload |

## Pages

All sidebar destinations are routed and rendered:

- `/calendar` — timer bar + week grid, with four working view modes (calendar, split, list, timesheet)
- `/reports` — summary tiles, bar chart, and project breakdown, all computed from the mock entries
- `/projects` — project table with time-status progress
- `/tasks` — list and board views
- `/timeline` — capacity lanes per person
- `/members`, `/approvals`, `/time-off` — including the real empty/upsell states

## What actually works

- The running timer ticks, and **Stop** commits a real entry (totals, calendar, reports all update).
- **Start** begins a new entry; the play button on any list row restarts that entry.
- The calendar view switcher, the Tasks list/board switcher, and task checkboxes all work.
- Buttons that lead outside the replicated surface (filters, export, settings) are intentionally inert.

## Design system reference

`src/index.css` holds the token layer. The naming mirrors Toggl's own:

- Surfaces: `--background-primary` `#1c1a1c`, `--background-secondary` `#131213`, `--background-tertiary` `#000`
- Text: `--foreground-primary` white, `--foreground-secondary` `#b3b0b2`, `--foreground-tertiary` `#575456`
- Accent: `--background-accent` `#c282b9`, muted surface `#371f34`
- Borders: `--stroke-primary` `#3c393b`, `--stroke-secondary` `#575456`
- Font: Inter. Body 14px/20px. Page titles 20px/600. Section labels 11px/600 uppercase, 0.025em.
- Controls: 32px tall, 8px radius, 1px border.

Tailwind v4 exposes these as `bg-surface`, `text-fg-2`, `border-line`, `bg-accent`, etc.
The raw extraction lives in `../research/`.

## Deploying

`npm run build` outputs to `dist/`. SPA fallbacks are configured for both Vercel (`vercel.json`)
and Netlify (`public/_redirects`).
