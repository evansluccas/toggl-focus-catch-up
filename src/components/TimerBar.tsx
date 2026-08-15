import { Icon } from "../icons";
import { useStore } from "../store";
import { formatClock } from "../data";
import { ProjectDot } from "./ui";

export default function TimerBar() {
  const {
    running,
    elapsed,
    startTimer,
    stopTimer,
    setRunning,
    addEntry,
    projectById,
    tasks,
  } = useStore();

  const project = projectById(running?.projectId ?? null);
  const task = tasks.find((t) => t.id === running?.taskId) ?? null;

  const handleStop = () => {
    if (!running) return;
    const startMin = 10 * 60 + 24;
    const endMin = startMin + Math.round(elapsed / 60);
    const fmt = (m: number) =>
      `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
    addEntry({
      description: running.description || "(no description)",
      projectId: running.projectId,
      taskId: running.taskId,
      day: 5,
      start: fmt(startMin),
      end: fmt(Math.max(endMin, startMin + 1)),
    });
    stopTimer();
  };

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 px-6">
      <input
        value={running?.description ?? ""}
        onChange={(e) => setRunning({ description: e.target.value })}
        placeholder="What are you working on?"
        disabled={!running}
        className="min-w-0 flex-1 bg-transparent text-xl font-semibold text-fg outline-none placeholder:text-fg-3 disabled:placeholder:text-fg-3"
      />

      <div className="flex shrink-0 items-center gap-1.5">
        <button className="inline-flex h-8 max-w-52 items-center gap-1.5 rounded-lg border border-line bg-transparent px-2.5 text-sm font-medium text-fg-2 transition-colors hover:bg-white/8 hover:text-fg">
          <Icon name="at" size={14} className="shrink-0" />
          <span className="truncate">{task ? task.name : "Task"}</span>
        </button>

        <button className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line bg-transparent px-2.5 text-sm font-medium transition-colors hover:bg-white/8">
          {project ? (
            <>
              <ProjectDot color={project.color} />
              <span className="text-fg">{project.name}</span>
              {project.client && (
                <span className="text-fg-2">· {project.client}</span>
              )}
            </>
          ) : (
            <>
              <Icon name="folder" size={14} className="text-fg-2" />
              <span className="text-fg-2">Project</span>
            </>
          )}
        </button>

        <button className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line bg-transparent px-2.5 text-sm font-medium text-fg-2 transition-colors hover:bg-white/8 hover:text-fg">
          <Icon name="hash" size={14} />
          Tags
        </button>

        <button
          className="inline-flex size-8 items-center justify-center rounded-lg text-fg-3 transition-colors hover:bg-white/8 hover:text-fg-2"
          title="Billable"
          aria-label="Billable"
        >
          <Icon name="billable" />
        </button>

        <button
          className="inline-flex size-8 items-center justify-center rounded-lg text-fg-2 transition-colors hover:bg-white/8 hover:text-fg"
          title="Select timer mode"
          aria-label="Select timer mode"
        >
          <Icon name="arrowUp" size={14} />
        </button>

        <div className="ml-1 flex h-8 min-w-[76px] items-center justify-center rounded-lg border border-line px-2 text-sm font-semibold tabular-nums text-fg">
          {formatClock(running ? elapsed : 0)}
        </div>

        {running ? (
          <button
            onClick={handleStop}
            title="Stop timer"
            aria-label="Stop timer"
            className="inline-flex size-8 items-center justify-center rounded-full bg-stop text-white transition-colors hover:bg-stop-hover"
          >
            <Icon name="stopSquare" size={9} />
          </button>
        ) : (
          <button
            onClick={() => startTimer({ description: "" })}
            title="Start timer"
            aria-label="Start timer"
            className="inline-flex size-8 items-center justify-center rounded-full bg-accent text-fg-inverted transition-colors hover:bg-accent-hover"
          >
            <Icon name="play" size={9} className="ml-px" />
          </button>
        )}

        <button
          className="inline-flex size-8 items-center justify-center rounded-lg text-fg-2 transition-colors hover:bg-white/8 hover:text-fg"
          title="More options"
          aria-label="More options"
        >
          <Icon name="more" />
        </button>
      </div>
    </header>
  );
}
