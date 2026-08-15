import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  initialEntries,
  initialProjects,
  initialTasks,
  type Entry,
  type Project,
  type Task,
} from "./data";

type RunningTimer = {
  description: string;
  projectId: string | null;
  taskId: string | null;
  startedAt: number;
};

type Store = {
  entries: Entry[];
  projects: Project[];
  tasks: Task[];

  projectById: (id: string | null) => Project | null;

  addEntry: (e: Omit<Entry, "id">) => void;
  /** Catch Up commits a whole week at once. */
  commitWeek: (
    projects: Omit<Project, "id">[],
    entries: CommitEntry[],
  ) => void;
  deleteEntry: (id: string) => void;

  running: RunningTimer | null;
  elapsed: number;
  startTimer: (t?: Partial<RunningTimer>) => void;
  stopTimer: () => void;
  setRunning: (patch: Partial<RunningTimer>) => void;

  /** Has the user brought in a week yet? Drives the calendar empty state. */
  hasData: boolean;
  reset: () => void;
};

export type CommitEntry = {
  description: string;
  day: number;
  start: string;
  end: string;
  /** name of the client/project this belongs to, or null */
  projectName: string | null;
  billable?: boolean;
};

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<Entry[]>(initialEntries);
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [tasks] = useState<Task[]>(initialTasks);
  const [running, setRunningState] = useState<RunningTimer | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const idRef = useRef(1000);

  useEffect(() => {
    if (!running) {
      setElapsed(0);
      return;
    }
    const tick = () =>
      setElapsed(Math.floor((Date.now() - running.startedAt) / 1000));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [running]);

  const projectById = useCallback(
    (id: string | null) => projects.find((p) => p.id === id) ?? null,
    [projects],
  );

  const commitWeek = useCallback(
    (newProjects: Omit<Project, "id">[], newEntries: CommitEntry[]) => {
      const created: Project[] = newProjects.map((p) => ({
        ...p,
        id: `p${++idRef.current}`,
      }));
      setProjects((prev) => [...prev, ...created]);

      const byName = new Map(created.map((p) => [p.name.toLowerCase(), p]));
      setEntries((prev) => [
        ...prev,
        ...newEntries.map((e) => {
          const project = e.projectName
            ? (byName.get(e.projectName.toLowerCase()) ?? null)
            : null;
          return {
            id: `e${++idRef.current}`,
            description: e.description,
            projectId: project?.id ?? null,
            taskId: null,
            day: e.day,
            start: e.start,
            end: e.end,
            billable: project?.rate != null,
          };
        }),
      ]);
    },
    [],
  );

  const value = useMemo<Store>(
    () => ({
      entries,
      projects,
      tasks,
      projectById,
      addEntry: (e) =>
        setEntries((prev) => [...prev, { ...e, id: `e${++idRef.current}` }]),
      commitWeek,
      deleteEntry: (id) => setEntries((prev) => prev.filter((e) => e.id !== id)),

      running,
      elapsed,
      startTimer: (t) =>
        setRunningState({
          description: t?.description ?? "",
          projectId: t?.projectId ?? null,
          taskId: t?.taskId ?? null,
          startedAt: t?.startedAt ?? Date.now(),
        }),
      stopTimer: () => setRunningState(null),
      setRunning: (patch) =>
        setRunningState((prev) => (prev ? { ...prev, ...patch } : prev)),

      hasData: entries.length > 0,
      reset: () => {
        setEntries(initialEntries);
        setProjects(initialProjects);
        setRunningState(null);
      },
    }),
    [entries, projects, tasks, projectById, commitWeek, running, elapsed],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
