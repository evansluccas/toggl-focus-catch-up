import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import TimerBar from "../components/TimerBar";
import {
  Button,
  IconButton,
  SegmentedIcons,
  ProjectDot,
  cx,
} from "../components/ui";
import { Icon } from "../icons";
import { useStore } from "../store";
import CatchUp from "../catchup/CatchUp";
import {
  DAY_NAMES,
  TODAY_INDEX,
  dateOfDay,
  durationMinutes,
  format12h,
  formatDuration,
  formatMinutes,
  formatMoney,
  toMinutes,
  type Entry,
  type Project,
} from "../data";

const ROW_H = 52;
const GUTTER = 64;
const RUNNING_START = "10:24";

const VIEWS = [
  { value: "calendar", icon: "calendarView" as const, label: "Calendar view" },
  { value: "split", icon: "panelRight" as const, label: "Split view" },
  { value: "list", icon: "listView" as const, label: "List view" },
  { value: "grid", icon: "gridView" as const, label: "Timesheet view" },
];

type Lookup = (id: string | null) => Project | null;

/* ---------------- entry block ---------------- */

function EntryBlock({
  entry,
  projectById,
  live,
  liveMinutes,
  narrow,
}: {
  entry: Entry;
  projectById: Lookup;
  live?: boolean;
  liveMinutes?: number;
  narrow?: boolean;
}) {
  const project = projectById(entry.projectId);
  const startMin = toMinutes(entry.start);
  const mins = live ? (liveMinutes ?? 0) : durationMinutes(entry);
  const top = (startMin / 60) * ROW_H;
  const height = Math.max((mins / 60) * ROW_H, 14);
  const color = project?.color ?? "#827F81";

  if (entry.planned) {
    return (
      <div
        className="absolute right-1 left-1 overflow-hidden rounded-md border border-dashed px-1.5 py-0.5"
        style={{
          top,
          height,
          borderColor: "rgb(var(--background-accent))",
          background: "rgb(var(--background-muted) / 0.5)",
        }}
        title={`${entry.description} · planned`}
      >
        <div className="truncate text-[11px] font-medium text-accent">
          {entry.description}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cx(
        "absolute right-1 left-1 overflow-hidden rounded-md px-1.5 py-0.5",
        live && "ring-2 ring-white/25",
      )}
      style={{ top, height, backgroundColor: color }}
      title={`${entry.description}${project ? ` · ${project.name}` : ""}`}
    >
      <div className="truncate text-[11px] font-semibold text-[#131213]">
        {entry.description || "(no description)"}
      </div>
      {height > 30 && !narrow && (
        <div className="truncate text-[10px] text-[#131213]/70">
          {formatDuration(mins * 60)}
        </div>
      )}
    </div>
  );
}

/* ---------------- week grid ---------------- */

function WeekGrid({
  entries,
  projectById,
  split,
  nowMinutes,
  runningEntry,
  runningMinutes,
}: {
  entries: Entry[];
  projectById: Lookup;
  split: boolean;
  nowMinutes: number;
  runningEntry: Entry | null;
  runningMinutes: number;
}) {
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scroller.current) scroller.current.scrollTop = 8 * ROW_H;
  }, []);

  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div ref={scroller} className="flex-1 overflow-y-auto">
      <div className="relative flex" style={{ height: 24 * ROW_H }}>
        <div
          className="sticky left-0 z-10 shrink-0 bg-surface"
          style={{ width: GUTTER }}
        >
          {hours.map((h) => (
            <div key={h} className="relative text-right" style={{ height: ROW_H }}>
              <span className="absolute -top-1.5 right-2 text-[11px] font-medium text-fg-2">
                {h === 0
                  ? ""
                  : `${h % 12 === 0 ? 12 : h % 12}:00 ${h >= 12 ? "PM" : "AM"}`}
              </span>
            </div>
          ))}
        </div>

        <div className="relative grid flex-1 grid-cols-7">
          <div className="pointer-events-none absolute inset-0">
            {hours.map((h) => (
              <div key={h} className="border-b border-line" style={{ height: ROW_H }} />
            ))}
          </div>

          {DAY_NAMES.map((_, day) => {
            const dayEntries = entries.filter((e) => e.day === day);
            const logged = dayEntries.filter((e) => !e.planned);
            const planned = dayEntries.filter((e) => e.planned);
            const isToday = day === TODAY_INDEX;

            return (
              <div
                key={day}
                className={cx(
                  "relative border-r border-line",
                  isToday && "bg-white/[0.015]",
                )}
              >
                {split ? (
                  <>
                    <div className="absolute inset-y-0 left-0 w-1/2">
                      {logged.map((e) => (
                        <EntryBlock key={e.id} entry={e} projectById={projectById} narrow />
                      ))}
                      {isToday && runningEntry && (
                        <EntryBlock
                          entry={runningEntry}
                          projectById={projectById}
                          live
                          liveMinutes={runningMinutes}
                          narrow
                        />
                      )}
                    </div>
                    <div className="absolute inset-y-0 right-0 w-1/2 border-l border-line/60">
                      {planned.map((e) => (
                        <EntryBlock key={e.id} entry={e} projectById={projectById} narrow />
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    {dayEntries.map((e) => (
                      <EntryBlock key={e.id} entry={e} projectById={projectById} />
                    ))}
                    {isToday && runningEntry && (
                      <EntryBlock
                        entry={runningEntry}
                        projectById={projectById}
                        live
                        liveMinutes={runningMinutes}
                      />
                    )}
                  </>
                )}

                {isToday && (
                  <div
                    className="pointer-events-none absolute right-0 left-0 z-20 flex items-center"
                    style={{ top: (nowMinutes / 60) * ROW_H }}
                  >
                    <span className="-ml-1 size-2 rounded-full bg-accent" />
                    <span className="h-px flex-1 bg-accent" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ---------------- list view ---------------- */

function ListView({
  entries,
  projectById,
  runningEntry,
  runningMinutes,
}: {
  entries: Entry[];
  projectById: Lookup;
  runningEntry: Entry | null;
  runningMinutes: number;
}) {
  const { startTimer } = useStore();
  const days = [...DAY_NAMES.keys()].reverse();

  return (
    <div className="flex-1 overflow-y-auto px-6 pb-6">
      {days.map((day) => {
        const dayEntries = entries
          .filter((e) => e.day === day && !e.planned)
          .sort((a, b) => toMinutes(b.start) - toMinutes(a.start));
        const isToday = day === TODAY_INDEX;
        const live = isToday && runningEntry ? runningMinutes : 0;
        const total = dayEntries.reduce((s, e) => s + durationMinutes(e), 0) + live;
        if (!dayEntries.length && !live) return null;
        const date = dateOfDay(day);

        return (
          <section key={day} className="mb-2">
            <div className="flex items-center gap-2 border-b border-line py-2">
              <span className="text-sm font-semibold text-fg">
                {isToday ? "Today" : DAY_NAMES[day]}
              </span>
              <span className="text-xs text-fg-2">
                {isToday ? `${DAY_NAMES[day]}, ` : ""}
                {date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </span>
              <span className="ml-auto text-sm font-semibold tabular-nums text-fg">
                {formatDuration(total * 60)}
              </span>
            </div>

            {isToday && runningEntry && (
              <EntryRow
                entry={runningEntry}
                projectById={projectById}
                minutes={runningMinutes}
                running
              />
            )}
            {dayEntries.map((e) => (
              <EntryRow
                key={e.id}
                entry={e}
                projectById={projectById}
                minutes={durationMinutes(e)}
                onPlay={() =>
                  startTimer({
                    description: e.description,
                    projectId: e.projectId,
                    taskId: e.taskId,
                  })
                }
              />
            ))}
          </section>
        );
      })}
    </div>
  );
}

function EntryRow({
  entry,
  projectById,
  minutes,
  running,
  onPlay,
}: {
  entry: Entry;
  projectById: Lookup;
  minutes: number;
  running?: boolean;
  onPlay?: () => void;
}) {
  const { stopTimer } = useStore();
  const project = projectById(entry.projectId);

  return (
    <div className="group flex h-11 items-center gap-3 border-b border-line/50 px-1 hover:bg-white/[0.03]">
      <span className="min-w-0 flex-1 truncate text-sm text-fg">
        {entry.description || <span className="text-fg-3">Add description</span>}
      </span>

      {project && (
        <span className="flex shrink-0 items-center gap-1.5 text-sm">
          <ProjectDot color={project.color} />
          <span className="text-fg-2">{project.name}</span>
        </span>
      )}

      <span className="w-20 shrink-0 text-right text-sm tabular-nums text-fg-2">
        {format12h(entry.start)}
      </span>
      <span className="w-20 shrink-0 text-right text-sm tabular-nums text-fg-2">
        {running ? "running" : format12h(entry.end)}
      </span>
      <span className="w-20 shrink-0 text-right text-sm font-medium tabular-nums text-fg">
        {formatDuration(minutes * 60)}
      </span>

      {running ? (
        <button
          onClick={stopTimer}
          aria-label="Stop timer"
          className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-stop text-white hover:bg-stop-hover"
        >
          <Icon name="stopSquare" size={8} />
        </button>
      ) : (
        <button
          onClick={onPlay}
          aria-label="Start timer"
          className="inline-flex size-7 shrink-0 items-center justify-center rounded-full text-fg-2 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-white/10 hover:text-fg"
        >
          <Icon name="play" size={9} className="ml-px" />
        </button>
      )}
    </div>
  );
}

/* ---------------- timesheet view ---------------- */

function TimesheetView({
  entries,
  projectById,
}: {
  entries: Entry[];
  projectById: Lookup;
}) {
  const rows = useMemo(() => {
    const map = new Map<string, { projectId: string | null; label: string; per: number[] }>();
    entries
      .filter((e) => !e.planned)
      .forEach((e) => {
        const key = `${e.projectId}|${e.description}`;
        if (!map.has(key))
          map.set(key, {
            projectId: e.projectId,
            label: e.description,
            per: Array(7).fill(0),
          });
        map.get(key)!.per[e.day] += durationMinutes(e);
      });
    return [...map.values()];
  }, [entries]);

  const colTotals = Array.from({ length: 7 }, (_, d) =>
    rows.reduce((s, r) => s + r.per[d], 0),
  );
  const grand = colTotals.reduce((a, b) => a + b, 0);

  return (
    <div className="flex-1 overflow-auto px-6 pb-6">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="text-[11px] font-semibold tracking-wide text-fg-2 uppercase">
            <th className="w-72 px-2 py-3 text-left">Entry</th>
            {DAY_NAMES.map((d, i) => (
              <th key={d} className="px-2 py-3 text-center">
                <div>{d}</div>
                <div className="font-normal text-fg-3">
                  {dateOfDay(i).toLocaleDateString("en-US", {
                    month: "2-digit",
                    day: "2-digit",
                  })}
                </div>
              </th>
            ))}
            <th className="px-2 py-3 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const project = projectById(r.projectId);
            const total = r.per.reduce((a, b) => a + b, 0);
            return (
              <tr key={i} className="border-t border-line">
                <td className="px-2 py-2">
                  <div className="flex items-center gap-2">
                    {project && <ProjectDot color={project.color} />}
                    <span className="truncate text-fg">{r.label}</span>
                  </div>
                  {project && (
                    <div className="pl-4 text-xs text-fg-3">{project.name}</div>
                  )}
                </td>
                {r.per.map((m, d) => (
                  <td key={d} className="px-2 py-2 text-center">
                    <div
                      className={cx(
                        "mx-auto flex h-8 w-16 items-center justify-center rounded-lg border text-sm tabular-nums",
                        m
                          ? "border-line-2 bg-surface text-fg"
                          : "border-transparent text-fg-3",
                      )}
                    >
                      {m ? formatDuration(m * 60) : "–"}
                    </div>
                  </td>
                ))}
                <td className="px-2 py-2 text-right font-medium tabular-nums text-fg">
                  {formatDuration(total * 60)}
                </td>
              </tr>
            );
          })}
          <tr className="border-t border-line">
            <td className="px-2 py-3">
              <Button icon="plus" variant="ghost" className="h-8 px-2">
                Add row
              </Button>
            </td>
            {colTotals.map((m, d) => (
              <td
                key={d}
                className="px-2 py-3 text-center text-sm font-medium tabular-nums text-fg-2"
              >
                {m ? formatDuration(m * 60) : "0h"}
              </td>
            ))}
            <td className="px-2 py-3 text-right text-sm font-semibold tabular-nums text-fg">
              {formatDuration(grand * 60)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

/* ---------------- empty state: the Catch Up invitation ---------------- */

function CatchUpInvite({ onStart }: { onStart: () => void }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center p-6">
      <div className="pointer-events-auto w-full max-w-md rounded-xl border border-line-2 bg-surface-2 p-6 text-center shadow-2xl">
        <div className="mx-auto mb-4 flex size-11 items-center justify-center rounded-full bg-muted">
          <Icon name="sparkles" size={20} className="text-accent" />
        </div>
        <h2 className="text-lg font-semibold text-fg">
          Your week isn't empty. Toggl's just new here.
        </h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-fg-2">
          You've already worked this week — it just isn't in here yet. Paste it
          from a spreadsheet or your notes, or type it from memory.
        </p>
        <Button variant="accent" className="mt-5 w-full" onClick={onStart}>
          Catch up my week
        </Button>
        <p className="mt-3 text-xs text-fg-3">
          Takes about a minute. Nothing to connect.
        </p>
      </div>
    </div>
  );
}

/* ---------------- page ---------------- */

export default function CalendarPage() {
  const { entries, running, elapsed, projectById, hasData } = useStore();
  const [view, setView] = useState("calendar");
  const [catchUpOpen, setCatchUpOpen] = useState(false);
  const [summary, setSummary] = useState<{
    minutes: number;
    clients: number;
    amount: number;
  } | null>(null);

  const runningMinutes = running ? elapsed / 60 : 0;
  const nowMinutes = toMinutes(RUNNING_START) + runningMinutes;

  const runningEntry: Entry | null = running
    ? {
        id: "running",
        description: running.description,
        projectId: running.projectId,
        taskId: running.taskId,
        day: TODAY_INDEX,
        start: RUNNING_START,
        end: RUNNING_START,
      }
    : null;

  const loggedMinutes =
    entries.filter((e) => !e.planned).reduce((s, e) => s + durationMinutes(e), 0) +
    runningMinutes;
  const plannedMinutes = entries
    .filter((e) => e.planned)
    .reduce((s, e) => s + durationMinutes(e), 0);

  const capacity = 40 * 60;
  const showInvite = !hasData && !running;

  return (
    <>
      <TimerBar />

      {/* toolbar */}
      <div className="flex h-12 shrink-0 items-center gap-2 px-6">
        <IconButton name="chevronLeft" aria-label="Previous period" />
        <button className="inline-flex h-8 items-center gap-2 rounded-lg border border-line-2 bg-surface px-3 text-sm font-semibold text-fg transition-colors hover:bg-surface-hover">
          <Icon name="calendar" className="text-fg-2" />
          This week
          <span className="font-normal text-fg-2">• W33</span>
        </button>
        <IconButton name="chevronRight" aria-label="Next period" />

        <div className="ml-auto flex items-center gap-2">
          {hasData && (
            <Button icon="sparkles" onClick={() => setCatchUpOpen(true)}>
              Catch up
            </Button>
          )}
          <Button trailingIcon="chevronDown">Week</Button>
          <SegmentedIcons options={VIEWS} value={view} onChange={setView} />
          <IconButton name="gear" aria-label="Calendar settings" />
          <IconButton name="panelRight" aria-label="Toggle panel" />
        </div>
      </div>

      {/* post-catch-up payoff */}
      {summary && (
        <div className="mx-6 mb-2 flex shrink-0 items-center gap-3 rounded-lg border border-stroke-success bg-success-fg/10 px-4 py-2.5">
          <Icon name="check" size={14} className="shrink-0 text-success-fg" />
          <p className="flex-1 text-sm text-fg">
            <span className="font-semibold">
              {formatMinutes(summary.minutes)}
            </span>{" "}
            added across{" "}
            <span className="font-semibold">
              {summary.clients} {summary.clients === 1 ? "client" : "clients"}
            </span>
            {summary.amount > 0 && (
              <>
                {" · "}
                <span className="font-semibold text-success-fg">
                  ${formatMoney(summary.amount)} billable
                </span>
              </>
            )}
          </p>
          <Link
            to="/reports"
            className="text-sm font-medium text-accent underline-offset-2 hover:underline"
          >
            See it in reports
          </Link>
          <button
            onClick={() => setSummary(null)}
            aria-label="Dismiss"
            className="inline-flex size-6 items-center justify-center rounded text-fg-2 hover:bg-white/8 hover:text-fg"
          >
            <Icon name="x" size={11} />
          </button>
        </div>
      )}

      {/* logged / planned */}
      <div className="flex h-8 shrink-0 items-center gap-3 px-6 text-xs">
        <span className="text-fg-2">Logged</span>
        <div className="h-1.5 w-56 overflow-hidden rounded-full bg-white/8">
          <div
            className="h-full rounded-full bg-[#C2E36A] transition-[width] duration-500"
            style={{ width: `${Math.min((loggedMinutes / capacity) * 100, 100)}%` }}
          />
        </div>
        <span className="font-medium tabular-nums text-fg">
          {loggedMinutes ? formatDuration(loggedMinutes * 60) : "0h"}
        </span>

        <span className="ml-4 text-fg-2">Planned</span>
        <div className="h-1.5 w-56 overflow-hidden rounded-full bg-white/8">
          <div
            className="h-full rounded-full bg-accent"
            style={{ width: `${Math.min((plannedMinutes / capacity) * 100, 100)}%` }}
          />
        </div>
        <span className="font-medium tabular-nums text-fg">
          {plannedMinutes ? formatDuration(plannedMinutes * 60) : "0h"}
        </span>

        <Link
          to="/reports"
          className="ml-auto inline-flex items-center gap-1 text-fg-2 transition-colors hover:text-fg"
        >
          View reports
          <Icon name="chevronRight" size={12} />
        </Link>
      </div>

      {/* day header */}
      {(view === "calendar" || view === "split") && (
        <div className="flex shrink-0 border-b border-line">
          <div
            className="flex shrink-0 items-center justify-center gap-1"
            style={{ width: GUTTER }}
          >
            <IconButton name="minus" size={8} aria-label="Zoom out" className="size-6" />
            <IconButton name="plus" size={8} aria-label="Zoom in" className="size-6" />
          </div>
          <div className="grid flex-1 grid-cols-7">
            {DAY_NAMES.map((name, day) => {
              const date = dateOfDay(day);
              const isToday = day === TODAY_INDEX;
              const dayLogged =
                entries
                  .filter((e) => e.day === day && !e.planned)
                  .reduce((s, e) => s + durationMinutes(e), 0) +
                (isToday ? runningMinutes : 0);
              const dayPlanned = entries
                .filter((e) => e.day === day && e.planned)
                .reduce((s, e) => s + durationMinutes(e), 0);

              return (
                <div
                  key={day}
                  className="flex items-center gap-2 border-r border-line px-3 py-2"
                >
                  <span
                    className={cx(
                      "flex size-9 items-center justify-center rounded-full text-[22px] font-semibold",
                      isToday ? "bg-accent/10 text-accent" : "text-fg",
                    )}
                  >
                    {date.getDate()}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-fg">{name}</span>
                    <span className="block text-xs tabular-nums text-fg-2">
                      {dayLogged ? formatDuration(dayLogged * 60) : "–"}
                      {view === "split" && (
                        <>
                          {" / "}
                          {dayPlanned ? formatDuration(dayPlanned * 60) : "–"}
                        </>
                      )}
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="relative flex min-h-0 flex-1 flex-col">
        {view === "calendar" || view === "split" ? (
          <WeekGrid
            entries={entries}
            projectById={projectById}
            split={view === "split"}
            nowMinutes={nowMinutes}
            runningEntry={runningEntry}
            runningMinutes={runningMinutes}
          />
        ) : view === "list" ? (
          <ListView
            entries={entries}
            projectById={projectById}
            runningEntry={runningEntry}
            runningMinutes={runningMinutes}
          />
        ) : (
          <TimesheetView entries={entries} projectById={projectById} />
        )}

        {showInvite && <CatchUpInvite onStart={() => setCatchUpOpen(true)} />}
      </div>

      {catchUpOpen && (
        <CatchUp
          onClose={() => setCatchUpOpen(false)}
          onDone={(s) => {
            setCatchUpOpen(false);
            setSummary(s);
          }}
        />
      )}
    </>
  );
}
