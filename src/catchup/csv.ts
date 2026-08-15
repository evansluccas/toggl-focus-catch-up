/* CSV handling for the import path.
   Toggl's own importer takes a CSV export from Harvest, Clockify, ClickUp and
   friends, and asks you to map its columns. We replicate that, then hand the
   result to the same review step the paste path uses — because Toggl's importer
   has no concept of a rate, so on its own it still lands you on $0.00. */

import { WEEK_START } from "../data";
import type { ParsedRow } from "./parse";
import { normaliseClient } from "./parse";

export type Csv = {
  name: string;
  headers: string[];
  rows: string[][];
};

/** Minimal RFC-4180-ish split: handles quoted fields containing commas. */
function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let quoted = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else quoted = false;
      } else cur += ch;
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === ",") {
      out.push(cur.trim());
      cur = "";
    } else cur += ch;
  }
  out.push(cur.trim());
  return out;
}

export function parseCsv(name: string, text: string): Csv {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (!lines.length) return { name, headers: [], rows: [] };

  const headers = splitCsvLine(lines[0]);
  const rows = lines.slice(1).map(splitCsvLine);
  return { name, headers, rows };
}

export type Mapping = {
  date: string;
  duration: string;
  description: string;
  client: string;
  project: string;
  billable: string;
};

const GUESSES: Record<keyof Mapping, string[]> = {
  date: ["date", "day", "start date", "spent_at", "started"],
  duration: ["hours", "duration", "time", "decimal hours"],
  description: ["notes", "description", "note", "memo", "comment"],
  client: ["client", "customer", "account"],
  project: ["project", "project name"],
  billable: ["billable", "is billable"],
};

/** Pre-select the columns a Harvest/Clockify export almost always has. */
export function guessMapping(headers: string[]): Mapping {
  const pick = (candidates: string[]) => {
    for (const c of candidates) {
      const hit = headers.find((h) => h.toLowerCase().trim() === c);
      if (hit) return hit;
    }
    for (const c of candidates) {
      const hit = headers.find((h) => h.toLowerCase().includes(c));
      if (hit) return hit;
    }
    return "";
  };

  return {
    date: pick(GUESSES.date),
    duration: pick(GUESSES.duration),
    description: pick(GUESSES.description),
    client: pick(GUESSES.client),
    project: pick(GUESSES.project),
    billable: pick(GUESSES.billable),
  };
}

/** "2026-08-11" → 1 (Tue). Returns null if outside the displayed week. */
function dayIndexFor(value: string): number | null {
  const m = value.match(/(\d{4})-(\d{2})-(\d{2})/);
  let d: Date | null = null;
  if (m) d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  else {
    const parsed = new Date(value);
    if (!isNaN(parsed.getTime())) d = parsed;
  }
  if (!d) return null;

  const diff = Math.round(
    (d.getTime() - WEEK_START.getTime()) / (24 * 60 * 60 * 1000),
  );
  return diff >= 0 && diff <= 6 ? diff : null;
}

/** "3.00" / "2:30" / "1h 30m" → minutes */
function durationToMinutes(value: string): number | null {
  const v = value.trim();
  if (!v) return null;

  const clock = v.match(/^(\d{1,3}):(\d{2})$/);
  if (clock) return Number(clock[1]) * 60 + Number(clock[2]);

  const hm = v.match(/^(\d+(?:[.,]\d+)?)\s*h(?:\s*(\d+)\s*m)?$/i);
  if (hm)
    return Math.round(parseFloat(hm[1].replace(",", ".")) * 60) +
      (hm[2] ? Number(hm[2]) : 0);

  const bare = parseFloat(v.replace(",", "."));
  if (isFinite(bare)) return Math.round(bare * 60);

  return null;
}

/** Turn mapped CSV rows into exactly the shape the review step already renders. */
export function csvToRows(csv: Csv, mapping: Mapping): ParsedRow[] {
  const col = (name: string) => {
    const i = csv.headers.indexOf(name);
    return i === -1 ? null : i;
  };

  const iDate = col(mapping.date);
  const iDur = col(mapping.duration);
  const iDesc = col(mapping.description);
  const iClient = col(mapping.client);
  const iProject = col(mapping.project);

  return csv.rows.map((cells, i) => {
    const rawDate = iDate != null ? (cells[iDate] ?? "") : "";
    const rawDur = iDur != null ? (cells[iDur] ?? "") : "";
    const rawDesc = iDesc != null ? (cells[iDesc] ?? "") : "";
    const rawClient = iClient != null ? (cells[iClient] ?? "") : "";
    const rawProject = iProject != null ? (cells[iProject] ?? "") : "";

    const day = rawDate ? dayIndexFor(rawDate) : null;
    const minutes = durationToMinutes(rawDur);
    const client = rawClient.trim() ? normaliseClient(rawClient) : null;

    return {
      id: `csv-${i}`,
      day,
      minutes,
      description: rawDesc.trim() || rawProject.trim() || "(no description)",
      client,
      explicitStart: null,
      raw: cells.join(", "),
      needsAttention: day === null || minutes === null,
    };
  });
}

/** A realistic Harvest export, so the path is testable without a real file. */
export const SAMPLE_CSV_NAME = "harvest-time-report-2026-08.csv";

export const SAMPLE_CSV = [
  "Date,Client,Project,Task,Notes,Hours,Billable",
  "2026-08-10,Acme,Website Redesign,Design,homepage wireframes,3.00,Yes",
  "2026-08-10,Acme,Website Redesign,Design,design review,1.50,Yes",
  "2026-08-11,Beta Corp,Mobile App,Research,onboarding flow,3.50,Yes",
  "2026-08-11,Beta Corp,Mobile App,Research,revisions,2.00,Yes",
  "2026-08-12,Acme,Website Redesign,Build,homepage build,4.00,Yes",
  "2026-08-13,Nordic Studio,Brand Identity,Design,logo concepts,2.50,Yes",
  "2026-08-13,,,,admin/invoicing,1.00,No",
  "2026-08-14,Acme,Website Redesign,Build,homepage build,3.00,Yes",
  '2026-08-14,Beta Corp,Mobile App,Meetings,"client call, weekly",0.75,Yes',
].join("\n");
