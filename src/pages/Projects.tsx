import { Button, IconButton, PageHeader, ProjectDot } from "../components/ui";
import { Icon } from "../icons";
import { useStore } from "../store";
import { durationMinutes, formatDuration } from "../data";

export default function ProjectsPage() {
  const { entries, projects } = useStore();

  const rows = projects.map((p) => ({
    ...p,
    logged: entries
      .filter((e) => e.projectId === p.id && !e.planned)
      .reduce((s, e) => s + durationMinutes(e), 0),
  }));

  return (
    <>
      <PageHeader
        title="Projects"
        actions={
          <Button variant="accent" icon="plus">
            New project
          </Button>
        }
      />

      <div className="flex h-12 shrink-0 items-center gap-2 px-6">
        <Button icon="folder" trailingIcon="chevronDown">
          Active
        </Button>
        <Button icon="filter">Filters</Button>
        <Button icon="groupBy">Group by</Button>
        <Button icon="sort">Sort by</Button>
        <div className="ml-auto flex items-center gap-1">
          <IconButton name="search" aria-label="Search projects" />
          <IconButton name="board" aria-label="Column settings" />
          <IconButton name="gear" aria-label="Project settings" />
        </div>
      </div>

      <div className="flex-1 overflow-auto px-6 pb-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-[11px] font-semibold tracking-wide text-fg-2 uppercase">
              <th className="w-8 px-2 py-2.5">
                <input
                  type="checkbox"
                  className="size-3.5 accent-[rgb(var(--background-accent))]"
                  aria-label="Select all projects"
                />
              </th>
              <th className="px-3 py-2.5 text-left">Project</th>
              <th className="px-3 py-2.5 text-left">Client</th>
              <th className="px-3 py-2.5 text-left">Billable</th>
              <th className="px-3 py-2.5 text-left">Estimate</th>
              <th className="px-3 py-2.5 text-left">Time status</th>
              <th className="px-3 py-2.5 text-right">Logged</th>
              <th className="px-3 py-2.5 text-right">Tags</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => {
              const estimateMin = p.estimate
                ? parseInt(p.estimate) * 60
                : null;
              const pct = estimateMin
                ? Math.min((p.logged / estimateMin) * 100, 100)
                : null;
              return (
                <tr
                  key={p.id}
                  className="border-b border-line/60 hover:bg-white/[0.03]"
                >
                  <td className="px-2 py-3">
                    <input
                      type="checkbox"
                      className="size-3.5 accent-[rgb(var(--background-accent))]"
                      aria-label={`Select ${p.name}`}
                    />
                  </td>
                  <td className="px-3 py-3">
                    <span className="flex items-center gap-2">
                      <Icon
                        name="folder"
                        size={14}
                        style={{ color: p.color }}
                        className="shrink-0"
                      />
                      <span className="font-medium text-fg">{p.name}</span>
                    </span>
                  </td>
                  <td className="px-3 py-3 text-fg-2">{p.client ?? "–"}</td>
                  <td className="px-3 py-3">
                    {p.billable ? (
                      <span className="inline-flex items-center gap-1 rounded bg-success-fg/10 px-1.5 py-0.5 text-xs font-medium text-success-fg">
                        Billable
                      </span>
                    ) : (
                      <span className="text-fg-3">–</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-fg-2">{p.estimate ?? "–"}</td>
                  <td className="px-3 py-3">
                    {pct !== null ? (
                      <span className="flex items-center gap-2">
                        <span className="h-1.5 w-24 overflow-hidden rounded-full bg-white/8">
                          <span
                            className="block h-full rounded-full"
                            style={{
                              width: `${pct}%`,
                              backgroundColor: p.color,
                            }}
                          />
                        </span>
                        <span className="text-xs tabular-nums text-fg-2">
                          {Math.round(pct)}%
                        </span>
                      </span>
                    ) : (
                      <span className="text-fg-3">No estimate</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-right font-medium tabular-nums text-fg">
                    {p.logged ? formatDuration(p.logged * 60) : "–"}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <ProjectDot color={p.color} />
                  </td>
                </tr>
              );
            })}
            <tr>
              <td colSpan={8} className="px-3 py-2">
                <Button variant="ghost" icon="plus" className="h-8 px-2">
                  Add project
                </Button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}
