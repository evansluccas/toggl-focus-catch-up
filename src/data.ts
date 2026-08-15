/* Mock workspace data. Week of Mon 10 Aug – Sun 16 Aug 2026, "today" = Sat 15.
   Week-one state: the workspace starts EMPTY, which is what a new signup actually sees. */

export type Project = {
  id: string;
  name: string;
  client: string | null;
  color: string;
  billable: boolean;
  /** hourly rate in USD; null = not set */
  rate: number | null;
  estimate?: string;
};

export type Entry = {
  id: string;
  description: string;
  projectId: string | null;
  taskId: string | null;
  /** 0 = Mon … 6 = Sun */
  day: number;
  start: string; // "09:30"
  end: string; // "11:00"
  billable?: boolean;
  /** planned slots render as outlined blocks */
  planned?: boolean;
};

export type Task = {
  id: string;
  name: string;
  projectId: string;
  status: "todo" | "in_progress" | "done";
  priority: "none" | "low" | "medium" | "high";
  assignee: string;
  due: string | null;
  estimate: string | null;
};

export const WEEK_START = new Date(2026, 7, 10); // Mon 10 Aug 2026
export const TODAY_INDEX = 5; // Saturday
export const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Palette used when Catch Up creates a project for a newly detected client. */
export const PROJECT_COLORS = [
  "#C2E36A",
  "#6EC9F5",
  "#EC85FE",
  "#F3C26A",
  "#C282B9",
  "#E87161",
];

/* A brand-new workspace: nothing tracked, nothing set up. */
export const initialProjects: Project[] = [];
export const initialEntries: Entry[] = [];
export const initialTasks: Task[] = [];

/* ---------- time helpers ---------- */

export const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

export const fromMinutes = (mins: number) => {
  const m = Math.max(0, Math.min(24 * 60 - 1, Math.round(mins)));
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
};

export const durationMinutes = (e: Entry) =>
  toMinutes(e.end) - toMinutes(e.start);

/** 9045 → "2h 30m" ; 320 → "5m 20s" */
export const formatDuration = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return m > 0 ? `${h}h ${m}m` : `${h}h`;
  if (m > 0) return s > 0 ? `${m}m ${s}s` : `${m}m`;
  return `${s}s`;
};

/** minutes → "3h 30m" (no seconds) */
export const formatMinutes = (mins: number) => {
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  if (h > 0) return m > 0 ? `${h}h ${m}m` : `${h}h`;
  return `${m}m`;
};

/** 3661 → "1:01:01" */
export const formatClock = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

/** "10:15" → "10:15 AM" */
export const format12h = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
};

export const dateOfDay = (day: number) => {
  const d = new Date(WEEK_START);
  d.setDate(d.getDate() + day);
  return d;
};

export const formatMoney = (amount: number) =>
  amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
