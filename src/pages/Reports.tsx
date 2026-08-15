import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Button,
  IconButton,
  PageHeader,
  ProjectDot,
  cx,
} from "../components/ui";
import { Icon } from "../icons";
import { useStore } from "../store";
import {
  DAY_NAMES,
  dateOfDay,
  durationMinutes,
  formatDuration,
  formatMoney,
} from "../data";

export default function ReportsPage() {
  const { entries, projects, projectById } = useStore();
  const [tab] = useState("Summary");

  const logged = entries.filter((e) => !e.planned);
  const totalMin = logged.reduce((s, e) => s + durationMinutes(e), 0);
  const billableMin = logged
    .filter((e) => projectById(e.projectId)?.rate != null)
    .reduce((s, e) => s + durationMinutes(e), 0);
  const amount = logged.reduce((sum, e) => {
    const rate = projectById(e.projectId)?.rate;
    return rate != null ? sum + (durationMinutes(e) / 60) * rate : sum;
  }, 0);
  const activeDays = new Set(logged.map((e) => e.day)).size || 1;
  const isEmpty = totalMin === 0;

  const perDay = Array.from({ length: 7 }, (_, d) =>
    logged
      .filter((e) => e.day === d)
      .reduce((s, e) => s + durationMinutes(e), 0),
  );
  const maxDay = Math.max(...perDay, 60);
  const scaleTop = Math.ceil(maxDay / 60) * 60;

  const perProject = projects
    .map((p) => {
      const mins = logged
        .filter((e) => e.projectId === p.id)
        .reduce((s, e) => s + durationMinutes(e), 0);
      const bill = p.rate != null ? mins : 0;
      return { project: p, mins, bill };
    })
    .filter((r) => r.mins > 0)
    .sort((a, b) => b.mins - a.mins);

  const stats = [
    {
      label: "Logged time",
      value: totalMin ? formatDuration(totalMin * 60) : "0h",
    },
    {
      label: "Billable time",
      value: billableMin ? formatDuration(billableMin * 60) : "0h",
      suffix: `(${Math.round((billableMin / (totalMin || 1)) * 100)}%)`,
    },
    {
      label: "Amount",
      value: formatMoney(amount),
      suffix: "USD",
    },
    {
      label: "Average daily hours",
      value: totalMin ? formatDuration((totalMin / activeDays) * 60) : "0h",
    },
  ];

  return (
    <>
      <PageHeader
        title="Reports"
        actions={
          <>
            <Button variant="ghost" trailingIcon="chevronDown">
              Rounding off
            </Button>
            <Button variant="ghost" icon="download" trailingIcon="chevronDown">
              Export
            </Button>
          </>
        }
      />

      <div className="flex h-12 shrink-0 items-center gap-2 px-6">
        <Button icon="board" trailingIcon="chevronDown">
          {tab}
        </Button>
        <div className="flex items-center gap-1">
          <IconButton name="chevronLeft" aria-label="Previous period" />
          <button className="inline-flex h-8 items-center gap-2 rounded-lg border border-line-2 bg-surface px-3 text-sm font-semibold text-fg transition-colors hover:bg-surface-hover">
            <Icon name="calendar" className="text-fg-2" />
            This week
            <span className="font-normal text-fg-2">• W33</span>
          </button>
          <IconButton name="chevronRight" aria-label="Next period" />
        </div>
        <Button icon="filter">Filters</Button>
        <div className="ml-auto flex items-center gap-2">
          <Button icon="billable" trailingIcon="chevronDown">
            Shown in USD
          </Button>
          <IconButton name="gear" aria-label="Report settings" />
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-6 pb-6">
        {/* summary tiles */}
        <div className="grid grid-cols-4 divide-x divide-line rounded-xl border border-line bg-surface-2/50">
          {stats.map((s) => (
            <div key={s.label} className="px-5 py-4">
              <div className="text-xs font-medium text-fg-2">{s.label}</div>
              <div className="mt-1.5 text-2xl font-semibold text-fg">
                {s.value}
                {s.suffix && (
                  <span className="ml-1.5 text-lg font-normal text-fg-2">
                    {s.suffix}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* bar chart */}
        <div className="rounded-xl border border-line bg-surface-2/50 p-5">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-fg">Logged time</h2>
            <Button trailingIcon="chevronDown">Logged time</Button>
          </div>

          <div className="flex gap-3">
            <div className="flex w-16 shrink-0 flex-col justify-between text-right text-[11px] text-fg-2">
              {[4, 3, 2, 1, 0].map((i) => (
                <span key={i}>
                  {i === 0 ? "0h" : formatDuration((scaleTop / 4) * i * 60)}
                </span>
              ))}
            </div>
            <div className="relative flex-1">
              <div className="absolute inset-0 flex flex-col justify-between">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} className="border-t border-dashed border-line" />
                ))}
              </div>
              <div className="relative flex h-52 items-end gap-2">
                {perDay.map((m, d) => (
                  <div
                    key={d}
                    className="group flex h-full flex-1 flex-col items-center justify-end"
                    title={`${DAY_NAMES[d]}: ${formatDuration(m * 60)}`}
                  >
                    <div
                      className="w-full max-w-24 rounded-t bg-accent transition-colors group-hover:bg-accent-hover"
                      style={{ height: `${(m / scaleTop) * 100}%` }}
                    />
                  </div>
                ))}

                {isEmpty && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-center">
                    <p className="text-lg font-semibold text-fg">
                      No logged time
                    </p>
                    <p className="text-sm text-fg-2">
                      <Link
                        to="/calendar"
                        className="text-fg-2 underline underline-offset-2 transition-colors hover:text-fg"
                      >
                        Schedule
                      </Link>{" "}
                      or{" "}
                      <Link
                        to="/calendar"
                        className="text-fg-2 underline underline-offset-2 transition-colors hover:text-fg"
                      >
                        log time
                      </Link>
                    </p>
                  </div>
                )}
              </div>
              <div className="mt-2 flex gap-2">
                {perDay.map((_, d) => (
                  <div key={d} className="flex-1 text-center text-[11px]">
                    <div className="text-fg-2">{DAY_NAMES[d]}</div>
                    <div className="text-fg-3">
                      {dateOfDay(d).toLocaleDateString("en-US", {
                        month: "numeric",
                        day: "numeric",
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {!isEmpty && (
            <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-fg-2">
              <span className="h-2 w-4 rounded-sm bg-accent" />
              Logged time
            </div>
          )}
        </div>

        {/* breakdown */}
        <div className="rounded-xl border border-line bg-surface-2/50">
          <div className="flex items-center justify-between px-5 py-4">
            <h2 className="text-sm font-semibold text-fg">
              Member and task breakdown
            </h2>
            <div className="flex items-center gap-2 text-sm text-fg-2">
              Breakdown by:
              <Button trailingIcon="chevronDown">Project</Button>
            </div>
          </div>

          {isEmpty ? (
            <div className="flex flex-col items-center justify-center gap-1 px-5 pb-16 text-center">
              <p className="text-lg font-semibold text-fg">No logged time</p>
              <p className="text-sm text-fg-2">
                <Link
                  to="/calendar"
                  className="text-fg-2 underline underline-offset-2 transition-colors hover:text-fg"
                >
                  Log time
                </Link>{" "}
                to see where your time goes
              </p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-y border-line text-[11px] font-semibold tracking-wide text-fg-2 uppercase">
                  <th className="px-5 py-2.5 text-left">Project</th>
                  <th className="px-5 py-2.5 text-left">Client</th>
                  <th className="px-5 py-2.5 text-right">Logged time</th>
                  <th className="px-5 py-2.5 text-right">Billable</th>
                  <th className="px-5 py-2.5 text-right">Amount</th>
                  <th className="px-5 py-2.5 text-right">Billable %</th>
                </tr>
              </thead>
              <tbody>
                {perProject.map(({ project, mins, bill }) => (
                  <tr
                    key={project.id}
                    className="border-b border-line/60 last:border-0 hover:bg-white/[0.03]"
                  >
                    <td className="px-5 py-3">
                      <span className="flex items-center gap-2">
                        <ProjectDot color={project.color} />
                        <span className="text-fg">{project.name}</span>
                      </span>
                    </td>
                    <td className="px-5 py-3 text-fg-2">
                      {project.client ?? "–"}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums text-fg">
                      {formatDuration(mins * 60)}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums text-fg-2">
                      {formatDuration(bill * 60)}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums text-fg">
                      {formatMoney(
                        project.rate != null ? (mins / 60) * project.rate : 0,
                      )}
                      <span className="ml-1 text-fg-2">USD</span>
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums text-fg-2">
                      {Math.round((bill / mins) * 100)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
