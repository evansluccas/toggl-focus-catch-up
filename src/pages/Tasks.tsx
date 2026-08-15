import { useState } from "react";
import {
  Button,
  EmptyState,
  IconButton,
  PageHeader,
  ProjectDot,
  SegmentedIcons,
  cx,
} from "../components/ui";
import { useStore } from "../store";
import { type Project, type Task } from "../data";
import emptyIllustration from "../assets/nothing-to-see.svg";

const STATUS_LABEL: Record<Task["status"], string> = {
  todo: "To do",
  in_progress: "In progress",
  done: "Done",
};

const PRIORITY_STYLE: Record<Task["priority"], string> = {
  high: "text-error-fg bg-error-fg/10",
  medium: "text-warning-fg bg-warning-fg/10",
  low: "text-fg-2 bg-white/8",
  none: "text-fg-3 bg-white/5",
};

/** Parse "2026-08-17" in local time so the day doesn't shift by timezone. */
function formatDue(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function TaskRow({
  task,
  projectById,
}: {
  task: Task;
  projectById: (id: string | null) => Project | null;
}) {
  const project = projectById(task.projectId);
  const [done, setDone] = useState(task.status === "done");

  return (
    <div className="group flex h-12 items-center gap-3 border-b border-line/60 px-2 hover:bg-white/[0.03]">
      <input
        type="checkbox"
        checked={done}
        onChange={(e) => setDone(e.target.checked)}
        className="size-4 shrink-0 accent-[rgb(var(--background-accent))]"
        aria-label={`Mark ${task.name} complete`}
      />
      <span
        className={cx(
          "min-w-0 flex-1 truncate text-sm",
          done ? "text-fg-3 line-through" : "text-fg",
        )}
      >
        {task.name}
      </span>

      {project && (
        <span className="flex shrink-0 items-center gap-1.5 text-sm">
          <ProjectDot color={project.color} />
          <span className="text-fg-2">{project.name}</span>
        </span>
      )}

      <span
        className={cx(
          "w-24 shrink-0 rounded px-1.5 py-0.5 text-center text-xs font-medium capitalize",
          PRIORITY_STYLE[task.priority],
        )}
      >
        {task.priority}
      </span>

      <span className="w-24 shrink-0 text-right text-sm text-fg-2">
        {task.due ? formatDue(task.due) : "–"}
      </span>
      <span className="w-14 shrink-0 text-right text-sm tabular-nums text-fg-2">
        {task.estimate ?? "–"}
      </span>
    </div>
  );
}

function BoardView({
  tasks,
  projectById,
}: {
  tasks: Task[];
  projectById: (id: string | null) => Project | null;
}) {
  const columns: Task["status"][] = ["todo", "in_progress", "done"];
  return (
    <div className="flex flex-1 gap-4 overflow-x-auto px-6 pb-6">
      {columns.map((status) => {
        const items = tasks.filter((t) => t.status === status);
        return (
          <div key={status} className="flex w-80 shrink-0 flex-col">
            <div className="flex items-center gap-2 py-2">
              <h2 className="text-sm font-semibold text-fg">
                {STATUS_LABEL[status]}
              </h2>
              <span className="rounded bg-white/8 px-1.5 text-xs text-fg-2">
                {items.length}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {items.map((t) => {
                const project = projectById(t.projectId);
                return (
                  <article
                    key={t.id}
                    className="rounded-lg border border-line bg-surface-2 p-3 transition-colors hover:border-line-2"
                  >
                    <p className="text-sm text-fg">{t.name}</p>
                    <div className="mt-2.5 flex items-center gap-2">
                      {project && (
                        <span className="flex items-center gap-1.5 text-xs text-fg-2">
                          <ProjectDot color={project.color} />
                          {project.name}
                        </span>
                      )}
                      <span
                        className={cx(
                          "ml-auto rounded px-1.5 py-0.5 text-[11px] font-medium capitalize",
                          PRIORITY_STYLE[t.priority],
                        )}
                      >
                        {t.priority}
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function TasksPage() {
  const [view, setView] = useState("list");
  const { tasks, projectById } = useStore();

  return (
    <>
      <PageHeader
        title="Tasks"
        subtitle={view === "list" ? "List" : "Board"}
        actions={
          <Button variant="accent" icon="plus">
            Add task
          </Button>
        }
      />

      <div className="flex h-12 shrink-0 items-center gap-2 px-6">
        <Button icon="members" trailingIcon="chevronDown">
          My tasks
        </Button>
        <Button icon="filter">
          Filters
          <span className="ml-0.5 flex size-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-fg-inverted">
            1
          </span>
        </Button>
        <Button icon="groupBy">
          Group by: <span className="text-accent">Date</span>
        </Button>
        <Button icon="sort">
          Sort by: <span className="text-accent">Priority</span>
        </Button>

        <div className="ml-auto flex items-center gap-1">
          <SegmentedIcons
            options={[
              { value: "list", icon: "listView", label: "List view" },
              { value: "board", icon: "board", label: "Board view" },
            ]}
            value={view}
            onChange={setView}
          />
          <IconButton name="search" aria-label="Find tasks by title" />
          <IconButton name="sparkles" aria-label="Import tasks" />
          <IconButton name="gear" aria-label="Task settings" />
        </div>
      </div>

      {!tasks.length ? (
        <EmptyState
          image={emptyIllustration}
          title="No tasks yet"
          description="Tasks let you plan work before you track it. You don't need them to start logging time."
        >
          <Button variant="accent" icon="plus">
            Add task
          </Button>
        </EmptyState>
      ) : view === "list" ? (
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <div className="flex items-center gap-3 border-b border-line px-2 py-2 text-[11px] font-semibold tracking-wide text-fg-2 uppercase">
            <span className="w-4" />
            <span className="flex-1">Task</span>
            <span className="w-32">Project</span>
            <span className="w-24 text-center">Priority</span>
            <span className="w-24 text-right">Due</span>
            <span className="w-14 text-right">Est.</span>
          </div>
          {tasks.map((t) => (
            <TaskRow key={t.id} task={t} projectById={projectById} />
          ))}
        </div>
      ) : (
        <BoardView tasks={tasks} projectById={projectById} />
      )}
    </>
  );
}
