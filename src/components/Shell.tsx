import { NavLink, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { Icon, type IconName } from "../icons";
import { cx } from "./ui";
import { useStore } from "../store";
import { formatDuration } from "../data";
import logo from "../assets/toggl-logo.svg";

/* ---------------- Left rail (48px) ---------------- */

function Rail() {
  return (
    <div className="flex w-12 shrink-0 flex-col items-center justify-between bg-surface-3 py-3">
      <div className="flex flex-col items-center">
        <img src={logo} alt="Toggl 2.0" className="size-6" />
        <span className="mt-0.5 text-[9px] font-semibold text-accent">2.0</span>
      </div>

      <button
        className="inline-flex size-8 items-center justify-center rounded-lg text-fg-2 transition-colors hover:bg-white/8 hover:text-fg"
        title="Toggle Sidebar"
        aria-label="Toggle Sidebar"
      >
        <Icon name="sidebarToggle" size={18} />
      </button>

      <div className="flex flex-col items-center gap-3">
        <button
          className="flex size-6 items-center justify-center rounded-full bg-muted-active text-[10px] font-semibold text-accent-active"
          title="Evansluccas"
        >
          EV
        </button>
        <button
          className="text-fg-2 transition-colors hover:text-fg"
          title="Notifications"
          aria-label="Notifications"
        >
          <Icon name="bell" />
        </button>
        <button
          className="text-fg-2 transition-colors hover:text-fg"
          title="Share feedback"
          aria-label="Share feedback"
        >
          <Icon name="send" />
        </button>
        <button
          className="text-fg-2 transition-colors hover:text-fg"
          title="Help"
          aria-label="Help"
        >
          <Icon name="help" />
        </button>
      </div>
    </div>
  );
}

/* ---------------- Sidebar nav item ---------------- */

function NavItem({
  to,
  icon,
  label,
  starred,
}: {
  to: string;
  icon: IconName;
  label: string;
  starred?: boolean;
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cx(
          "group flex h-8 items-center gap-2.5 rounded-lg px-2.5 text-sm font-medium transition-colors duration-150",
          isActive
            ? "bg-muted text-fg"
            : "text-fg-2 hover:bg-white/6 hover:text-fg",
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            name={icon}
            className={cx(
              "shrink-0",
              isActive ? "text-accent" : "text-fg-2 group-hover:text-fg-2-hover",
            )}
          />
          <span className="flex-1 truncate">{label}</span>
          {starred && (
            <Icon
              name="star"
              size={12}
              className="shrink-0 text-fg-3"
              aria-hidden
            />
          )}
        </>
      )}
    </NavLink>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="px-2.5 pt-4 pb-1 text-[11px] font-semibold tracking-wide text-fg-2 uppercase">
      {children}
    </div>
  );
}

/* ---------------- Sidebar (200px) ---------------- */

function Sidebar() {
  const { running, elapsed, hasData, reset } = useStore();
  const { pathname } = useLocation();
  const timerActive = pathname.startsWith("/calendar");

  return (
    <div className="flex w-50 shrink-0 flex-col bg-surface-3">
      {/* org switcher */}
      <button className="flex h-14 shrink-0 items-center gap-1.5 px-2.5 text-left transition-colors hover:bg-white/6">
        <span className="truncate text-sm font-semibold text-fg">
          Evansluccas's orga…
        </span>
        <Icon name="chevronDown" className="shrink-0 text-fg-2" />
      </button>

      <nav className="flex-1 overflow-y-auto px-2 pb-2">
        <SectionLabel>Track</SectionLabel>
        <NavLink
          to="/calendar"
          className={cx(
            "group flex h-8 items-center gap-2.5 rounded-lg px-2.5 text-sm font-medium transition-colors duration-150",
            timerActive
              ? "bg-muted text-accent"
              : "text-fg-2 hover:bg-white/6 hover:text-fg",
          )}
        >
          <Icon
            name="clock"
            size={14}
            className={cx("shrink-0", timerActive && "text-accent")}
          />
          <span className="flex-1">Timer</span>
          {running && (
            <span className="text-xs font-medium tabular-nums text-fg">
              {formatDuration(elapsed)}
            </span>
          )}
          <Icon
            name="pencil"
            size={12}
            className="shrink-0 text-fg-2 opacity-0 transition-opacity group-hover:opacity-100"
          />
        </NavLink>

        <SectionLabel>Analyze</SectionLabel>
        <NavItem to="/reports" icon="reports" label="Reports" />

        <SectionLabel>Plan</SectionLabel>
        <NavItem to="/projects" icon="folder" label="Projects" />
        <NavItem to="/tasks" icon="tasks" label="Tasks" />
        <NavItem to="/timeline" icon="timeline" label="Timeline" starred />

        <SectionLabel>Manage</SectionLabel>
        <NavItem to="/members" icon="members" label="Members" />
        <NavItem to="/approvals" icon="approvals" label="Approvals" starred />
        <NavItem to="/time-off" icon="timeOff" label="Time off" starred />
      </nav>

      <div className="shrink-0 space-y-0.5 px-2 pb-3">
        <button className="flex h-8 w-full items-center gap-2.5 rounded-lg px-2.5 text-sm font-medium text-accent transition-colors hover:bg-white/6">
          <svg viewBox="0 0 20 20" className="size-5 shrink-0" fill="none">
            <circle cx="10" cy="10" r="10" fill="rgb(var(--background-accent))" />
            <path
              d="M10 15V6M14 10L10 6L6 10"
              stroke="#F5F5F5"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="flex-1 text-left">Upgrade</span>
          <span className="rounded bg-muted-active px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-accent-active uppercase">
            31 days
          </span>
        </button>
        <button className="flex h-8 w-full items-center gap-2.5 rounded-lg px-2.5 text-sm font-medium text-fg-2 transition-colors hover:bg-white/6 hover:text-fg">
          <Icon name="download" className="shrink-0" />
          <span className="flex-1 text-left">Download apps</span>
        </button>
        <button className="flex h-8 w-full items-center gap-2.5 rounded-lg px-2.5 text-sm font-medium text-fg-2 transition-colors hover:bg-white/6 hover:text-fg">
          <Icon name="gear" className="shrink-0" />
          <span className="flex-1 text-left">Admin settings</span>
        </button>

        {hasData && (
          <button
            onClick={reset}
            title="Clear the workspace and return to the first-run state"
            className="mt-1 flex h-7 w-full items-center gap-2.5 rounded-lg border border-dashed border-line px-2.5 text-xs font-medium text-fg-3 transition-colors hover:border-line-2 hover:text-fg-2"
          >
            <Icon name="x" size={10} className="shrink-0" />
            <span className="flex-1 text-left">Reset demo</span>
          </button>
        )}
      </div>
    </div>
  );
}

/* ---------------- Shell ---------------- */

export default function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full w-full overflow-hidden bg-surface-3">
      <Rail />
      <Sidebar />
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-surface">
        {children}
      </main>
    </div>
  );
}
