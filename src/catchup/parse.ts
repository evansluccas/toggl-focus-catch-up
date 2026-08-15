/* Parser for Catch Up.
   Turns whatever a freelancer pastes — spreadsheet rows, notes, or typing from
   memory — into structured rows. Deliberately tolerant: mixed duration formats,
   inconsistent client casing, tabs from a spreadsheet, rows with no client.
   Anything it cannot read is returned flagged, never silently dropped. */

import { DAY_NAMES, fromMinutes, toMinutes } from "../data";

export type ParsedRow = {
  id: string;
  /** 0 = Mon … 6 = Sun, or null if we could not read a day */
  day: number | null;
  /** duration in minutes, or null if unreadable */
  minutes: number | null;
  description: string;
  /** normalised client name, or null for unassigned work */
  client: string | null;
  /** explicit start time if the input gave a range */
  explicitStart: string | null;
  /** the original line, kept so the user can see what we read */
  raw: string;
  /** true when we could not confidently read day or duration */
  needsAttention: boolean;
};

const DAY_TOKENS: Record<string, number> = {
  mon: 0, monday: 0,
  tue: 1, tues: 1, tuesday: 1,
  wed: 2, weds: 2, wednesday: 2,
  thu: 3, thur: 3, thurs: 3, thursday: 3,
  fri: 4, friday: 4,
  sat: 5, saturday: 5,
  sun: 6, sunday: 6,
};

/** "3h" "2.5h" "1h 30m" "45m" "1.5" "09:00-12:30" */
function readDuration(token: string): { minutes: number; start: string | null } | null {
  const t = token.trim().toLowerCase();

  const range = t.match(/^(\d{1,2}):(\d{2})\s*[-–—]\s*(\d{1,2}):(\d{2})$/);
  if (range) {
    const start = `${range[1].padStart(2, "0")}:${range[2]}`;
    const end = `${range[3].padStart(2, "0")}:${range[4]}`;
    const mins = toMinutes(end) - toMinutes(start);
    if (mins > 0) return { minutes: mins, start };
    return null;
  }

  const hm = t.match(/^(\d+(?:[.,]\d+)?)\s*h(?:\s*(\d+)\s*m)?$/);
  if (hm) {
    const hours = parseFloat(hm[1].replace(",", "."));
    const mins = hm[2] ? parseInt(hm[2], 10) : 0;
    return { minutes: Math.round(hours * 60) + mins, start: null };
  }

  const mOnly = t.match(/^(\d+)\s*m(?:in)?$/);
  if (mOnly) return { minutes: parseInt(mOnly[1], 10), start: null };

  const bare = t.match(/^(\d+(?:[.,]\d+)?)$/);
  if (bare) {
    const hours = parseFloat(bare[1].replace(",", "."));
    if (hours > 0 && hours <= 24) return { minutes: Math.round(hours * 60), start: null };
  }

  return null;
}

/** "beta corp" and "Beta Corp" should become one client. */
export function normaliseClient(name: string) {
  return name
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .map((w) =>
      w.length <= 3 && w === w.toUpperCase()
        ? w // keep acronyms like "BBC"
        : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase(),
    )
    .join(" ");
}

/** Split a line into fields on tabs, 2+ spaces, or " - ". */
function splitFields(line: string) {
  return line
    .split(/\t+|\s{2,}|\s+-\s+/)
    .map((f) => f.trim())
    .filter(Boolean);
}

export function parseWeek(input: string): ParsedRow[] {
  const lines = input
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const rows = lines.map((raw, i) => parseLine(raw, i));

  // Second pass. Lines separated by tabs or wide gaps tell us a client name
  // exactly; lines typed with single spaces do not, so "Tue 2h Beta Corp calls"
  // would otherwise yield a client called "Beta". Re-read the loose lines
  // against the names we are confident about, longest first.
  const confident = Array.from(
    new Set(rows.filter((r) => r.viaDelimiter && r.client).map((r) => r.client as string)),
  ).sort((a, b) => b.length - a.length);

  if (!confident.length) return rows.map(stripInternal);

  return rows
    .map((row) => {
      if (row.viaDelimiter) return row;
      const full = [row.client, row.description].filter(Boolean).join(" ");
      for (const name of confident) {
        if (full.toLowerCase().startsWith(name.toLowerCase())) {
          const rest = full.slice(name.length).trim();
          return {
            ...row,
            client: name,
            description: rest || "(no description)",
          };
        }
      }
      return row;
    })
    .map(stripInternal);
}

type InternalRow = ParsedRow & { viaDelimiter: boolean };

const stripInternal = (r: InternalRow): ParsedRow => {
  const { viaDelimiter: _drop, ...rest } = r;
  return rest;
};

function parseLine(raw: string, i: number): InternalRow {
  {
    let fields = splitFields(raw);
    const viaDelimiter = fields.length > 1;

    // A single-field line may still be "Mon 3h Acme thing" with single spaces.
    if (fields.length === 1) fields = raw.split(/\s+/).filter(Boolean);

    let day: number | null = null;
    let minutes: number | null = null;
    let explicitStart: string | null = null;

    // pull out the day token
    for (let f = 0; f < fields.length; f++) {
      const key = fields[f].toLowerCase().replace(/[.,]$/, "");
      if (key in DAY_TOKENS) {
        day = DAY_TOKENS[key];
        fields.splice(f, 1);
        break;
      }
    }

    // pull out the duration token
    for (let f = 0; f < fields.length; f++) {
      const d = readDuration(fields[f]);
      if (d) {
        minutes = d.minutes;
        explicitStart = d.start;
        fields.splice(f, 1);
        break;
      }
    }

    // Only read a client out of the remainder when we understood the line well
    // enough to trust its shape. A prose note like "finish the thing for that
    // guy" has no day and no duration — guessing "Finish" as a client from it
    // invents a client the user never had.
    const confident = day !== null && minutes !== null;
    let client: string | null = null;
    let description = "";

    if (confident && fields.length >= 2) {
      client = normaliseClient(fields[0]);
      description = fields.slice(1).join(" ");
    } else {
      description = fields.join(" ");
    }

    return {
      id: `row-${i}`,
      day,
      minutes,
      description: description || "(no description)",
      client,
      explicitStart,
      raw,
      needsAttention: day === null || minutes === null,
      viaDelimiter,
    };
  }
}

/** Lay rows out on a real clock: explicit times win, everything else stacks from 9am. */
export function scheduleRows(rows: ParsedRow[]) {
  const cursors = new Map<number, number>();
  const DAY_START = 9 * 60;

  return rows.map((row) => {
    if (row.day === null || row.minutes === null) {
      return { ...row, start: null as string | null, end: null as string | null };
    }
    const cursor = cursors.get(row.day) ?? DAY_START;
    const startMin = row.explicitStart ? toMinutes(row.explicitStart) : cursor;
    const endMin = startMin + row.minutes;
    cursors.set(row.day, Math.max(cursor, endMin));
    return { ...row, start: fromMinutes(startMin), end: fromMinutes(endMin) };
  });
}

/** Distinct clients in first-seen order. */
export function clientsIn(rows: ParsedRow[]) {
  const seen: string[] = [];
  for (const r of rows) {
    if (r.client && !seen.includes(r.client)) seen.push(r.client);
  }
  return seen;
}

export const SAMPLE_WEEK = [
  "Mon\t3h\tAcme\thomepage wireframes",
  "Mon\t1.5\tacme - design review",
  "Tue\t09:00-12:30\tBeta Corp\tonboarding flow",
  "tue\t2h\tbeta corp\trevisions",
  "Wed\t4h\tAcme\thomepage build",
  "Thu\t2.5h\tNordic Studio\tlogo concepts",
  "Thu\t1h\tadmin/invoicing",
  "Fri\t3h\tAcme\thomepage build",
  "Fri\t45m\tBeta Corp\tclient call",
].join("\n");

export { DAY_NAMES };
