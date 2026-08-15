import { Button, IconButton, PageHeader, cx } from "../components/ui";
import { Icon } from "../icons";
import { useStore } from "../store";
import {
  DAY_NAMES,
  TODAY_INDEX,
  dateOfDay,
  durationMinutes,
  formatDuration,
} from "../data";

const CAPACITY_MIN = 40 * 60;

const people = [
  { id: "u0", name: "No assignee", initials: "NA", isPlaceholder: true },
  { id: "u1", name: "Evansluccas", initials: "EV", isPlaceholder: false },
];

export default function TimelinePage() {
  const { entries, projectById } = useStore();

  const bookedMin = entries
    .filter((e) => e.planned)
    .reduce((s, e) => s + durationMinutes(e), 0);
  const freeMin = Math.max(CAPACITY_MIN - bookedMin, 0);

  return (
    <>
      <PageHeader
        title="Timeline"
        actions={
          <Button variant="accent" icon="plus">
            Add member
          </Button>
        }
      />

      <div className="flex h-12 shrink-0 items-center gap-2 px-6">
        <Button icon="members" trailingIcon="chevronDown">
          People
        </Button>
        <Button icon="filter">Filters</Button>
        <Button icon="sort">
          Sort by: <span className="text-accent">Name</span>
        </Button>
        <Button icon="calendar">
          Capacity: <span className="text-accent">This week</span>
        </Button>
        <div className="ml-auto flex items-center gap-1">
          <IconButton name="chevronLeft" aria-label="Previous period" />
          <IconButton name="chevronRight" aria-label="Next period" />
          <Button trailingIcon="chevronDown" className="ml-1">
            Weeks
          </Button>
          <IconButton name="minus" size={8} aria-label="Zoom out" />
          <IconButton name="plus" size={8} aria-label="Zoom in" />
          <IconButton name="gear" aria-label="Timeline settings" />
          <IconButton name="panelRight" aria-label="Toggle panel" />
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="flex min-w-max">
          {/* people column */}
          <div className="sticky left-0 z-10 w-64 shrink-0 border-r border-line bg-surface">
            <div className="flex h-14 items-center border-b border-line px-4">
              <span className="text-sm font-semibold text-fg">People</span>
              <span className="ml-2 text-xs text-fg-2">{people.length - 1}</span>
            </div>
            {people.map((p) => (
              <div
                key={p.id}
                className="flex h-20 items-center gap-2.5 border-b border-line px-4"
              >
                <span
                  className={cx(
                    "flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold",
                    p.isPlaceholder
                      ? "bg-white/8 text-fg-2"
                      : "bg-muted-active text-accent-active",
                  )}
                >
                  {p.initials}
                </span>
                <div className="min-w-0">
                  <div className="truncate text-sm text-fg">{p.name}</div>
                  {!p.isPlaceholder && (
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className="h-1 w-16 overflow-hidden rounded-full bg-white/8">
                        <span
                          className="block h-full rounded-full bg-accent"
                          style={{
                            width: `${(bookedMin / CAPACITY_MIN) * 100}%`,
                          }}
                        />
                      </span>
                      <span className="text-[11px] tabular-nums text-fg-2">
                        {formatDuration(freeMin * 60)} free
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* week grid */}
          <div className="flex-1">
            <div className="flex h-14 border-b border-line">
              {DAY_NAMES.map((name, day) => {
                const date = dateOfDay(day);
                const isToday = day === TODAY_INDEX;
                return (
                  <div
                    key={day}
                    className="flex w-32 shrink-0 flex-col items-center justify-center border-r border-line"
                  >
                    <span className="text-[11px] text-fg-2">{name}</span>
                    <span
                      className={cx(
                        "mt-0.5 flex size-6 items-center justify-center rounded-full text-sm font-medium",
                        isToday ? "bg-accent text-fg-inverted" : "text-fg",
                      )}
                    >
                      {date.getDate()}
                    </span>
                  </div>
                );
              })}
            </div>

            {people.map((p) => (
              <div key={p.id} className="flex h-20 border-b border-line">
                {DAY_NAMES.map((_, day) => {
                  const planned = p.isPlaceholder
                    ? []
                    : entries.filter((e) => e.day === day && e.planned);
                  const isWeekend = day > 4;
                  return (
                    <div
                      key={day}
                      className={cx(
                        "relative w-32 shrink-0 border-r border-line p-1.5",
                        isWeekend && "bg-white/[0.015]",
                      )}
                    >
                      {planned.map((e) => {
                        const project = projectById(e.projectId);
                        return (
                          <div
                            key={e.id}
                            className="mb-1 rounded border border-dashed px-1.5 py-1"
                            style={{
                              borderColor: "rgb(var(--background-accent))",
                              background: "rgb(var(--background-muted) / 0.5)",
                            }}
                            title={e.description}
                          >
                            <div className="truncate text-[11px] font-medium text-accent">
                              {e.description}
                            </div>
                            <div className="truncate text-[10px] text-accent/70">
                              {project?.name}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center justify-center py-16 text-center">
          <img
            src={new URL("../assets/users-BT1GkGlA.svg", import.meta.url).href}
            alt=""
            className="mb-5 w-24"
          />
          <h2 className="text-base font-semibold text-fg">
            Plan capacity across your team
          </h2>
          <p className="mt-1.5 max-w-sm text-sm text-fg-2">
            See who's overbooked or under capacity at a glance. This space fills
            with a lane for each person you invite.
          </p>
          <Button variant="accent" className="mt-5">
            Invite members
          </Button>
        </div>
      </div>
    </>
  );
}
