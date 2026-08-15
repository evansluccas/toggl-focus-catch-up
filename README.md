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

## Catch Up — the feature

The calendar's empty state is the entry point. One box takes whatever the freelancer has —
spreadsheet rows, notes, or typing from memory — and the parser copes with mixed durations
(`3h`, `1.5`, `09:00-12:30`, `45m`), inconsistent client casing, and tabs from a spreadsheet.
Lines it can't confidently read are flagged rather than guessed at.

The review step is where the value lands: confirm the week, then set what each client is worth.
**The rate is asked for at the moment it turns into money, not during onboarding** — the billable
total updates live as you type. Skip it and you still get hours grouped by client.

Confirming writes real state: the calendar fills, the Logged bar moves, projects are created with
their clients and rates, and Reports goes from "No logged time · $0.00" to real numbers.

### Two on-ramps, one payoff

"Import a CSV instead" opens a replica of Toggl's existing Universal CSV Importer (upload → choose
entity → map columns), which today is buried in Admin settings → Data import. It accepts a real
`.csv` drop or a bundled sample Harvest export, auto-guesses the column mapping, and then hands off
to the **same review step** — because Toggl's importer has no concept of a rate, so on its own it
still lands you on $0.00.

## What actually works

- The whole Catch Up flow, both on-ramps, including file drop and column mapping.
- The running timer ticks, and **Stop** commits a real entry (totals, calendar, reports all update).
- **Start** begins a new entry; the play button on any list row restarts that entry.
- The calendar view switcher, the Tasks list/board switcher, and task checkboxes all work.
- **Reset demo** (sidebar footer) returns to the first-run state — handy for re-recording.
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
