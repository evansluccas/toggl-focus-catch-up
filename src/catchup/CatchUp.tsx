import { useMemo, useState } from "react";
import { Icon } from "../icons";
import { Button, cx } from "../components/ui";
import { useStore, type CommitEntry } from "../store";
import {
  DAY_NAMES,
  PROJECT_COLORS,
  dateOfDay,
  formatMinutes,
  formatMoney,
  type Project,
} from "../data";
import {
  SAMPLE_WEEK,
  clientsIn,
  parseWeek,
  scheduleRows,
  type ParsedRow,
} from "./parse";

const UNASSIGNED = "__none__";

export default function CatchUp({
  onClose,
  onDone,
}: {
  onClose: () => void;
  onDone: (summary: { minutes: number; clients: number; amount: number }) => void;
}) {
  const { commitWeek } = useStore();
  const [step, setStep] = useState<"input" | "review">("input");
  const [text, setText] = useState(SAMPLE_WEEK);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [rates, setRates] = useState<Record<string, string>>({});

  /** every detected client — drives the per-row dropdown */
  const clients = useMemo(() => clientsIn(rows), [rows]);
  const scheduled = useMemo(() => scheduleRows(rows), [rows]);

  const totalMinutes = rows.reduce((s, r) => s + (r.minutes ?? 0), 0);

  const minutesByClient = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of rows) {
      const key = r.client ?? UNASSIGNED;
      map.set(key, (map.get(key) ?? 0) + (r.minutes ?? 0));
    }
    return map;
  }, [rows]);

  /** only clients with time against them are worth asking a rate for */
  const ratedClients = useMemo(
    () => clients.filter((c) => (minutesByClient.get(c) ?? 0) > 0),
    [clients, minutesByClient],
  );

  const amount = useMemo(
    () =>
      ratedClients.reduce((sum, c) => {
        const rate = parseFloat(rates[c] ?? "");
        if (!isFinite(rate)) return sum;
        return sum + ((minutesByClient.get(c) ?? 0) / 60) * rate;
      }, 0),
    [ratedClients, rates, minutesByClient],
  );

  const unreadable = rows.filter((r) => r.needsAttention).length;

  const handleParse = () => {
    setRows(parseWeek(text));
    setStep("review");
  };

  const updateRow = (id: string, patch: Partial<ParsedRow>) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const removeRow = (id: string) =>
    setRows((prev) => prev.filter((r) => r.id !== id));

  const handleConfirm = () => {
    const newProjects: Omit<Project, "id">[] = ratedClients.map((name, i) => {
      const rate = parseFloat(rates[name] ?? "");
      return {
        name,
        client: name,
        color: PROJECT_COLORS[i % PROJECT_COLORS.length],
        billable: isFinite(rate),
        rate: isFinite(rate) ? rate : null,
      };
    });

    const newEntries: CommitEntry[] = scheduled
      .filter((r) => r.day !== null && r.start && r.end)
      .map((r) => ({
        description: r.description,
        day: r.day as number,
        start: r.start as string,
        end: r.end as string,
        projectName: r.client,
      }));

    commitWeek(newProjects, newEntries);
    onDone({
      minutes: totalMinutes,
      clients: ratedClients.length,
      amount,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
      <div
        className={cx(
          "flex max-h-full w-full flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-2xl",
          step === "input" ? "max-w-2xl" : "max-w-5xl",
        )}
      >
        {/* header */}
        <div className="flex shrink-0 items-center gap-3 px-6 pt-5">
          <div className="flex flex-1 items-center gap-1.5">
            {["input", "review"].map((s) => (
              <span
                key={s}
                className={cx(
                  "h-1 w-6 rounded-full transition-colors",
                  step === s ? "bg-accent" : "bg-line",
                )}
              />
            ))}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="inline-flex size-7 items-center justify-center rounded-lg text-fg-2 transition-colors hover:bg-white/8 hover:text-fg"
          >
            <Icon name="x" size={14} />
          </button>
        </div>

        {step === "input" ? (
          <InputStep
            text={text}
            setText={setText}
            onContinue={handleParse}
          />
        ) : (
          <ReviewStep
            rows={rows}
            clients={clients}
            ratedClients={ratedClients}
            rates={rates}
            setRates={setRates}
            minutesByClient={minutesByClient}
            totalMinutes={totalMinutes}
            amount={amount}
            unreadable={unreadable}
            updateRow={updateRow}
            removeRow={removeRow}
            onBack={() => setStep("input")}
            onConfirm={handleConfirm}
          />
        )}
      </div>
    </div>
  );
}

/* ---------------- Step 1: tell us your week ---------------- */

function InputStep({
  text,
  setText,
  onContinue,
}: {
  text: string;
  setText: (v: string) => void;
  onContinue: () => void;
}) {
  const lineCount = text.split("\n").filter((l) => l.trim()).length;

  return (
    <>
      <div className="px-6 pt-3 pb-5">
        <h2 className="text-xl font-semibold text-fg">
          What did you work on this week?
        </h2>
        <p className="mt-1.5 text-sm text-fg-2">
          Paste it from a spreadsheet or your notes, or just type it from memory.
          One line per chunk of work — we'll sort out the format.
        </p>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          spellCheck={false}
          className="mt-4 h-64 w-full resize-none rounded-lg border border-line bg-surface-2 p-3.5 font-mono text-[13px] leading-6 text-fg outline-none transition-colors focus:border-line-2-hover"
          placeholder={"Mon  3h  Acme  homepage wireframes\nTue  09:00-12:30  Beta Corp  onboarding flow\nWed  2.5h  Nordic Studio  logo concepts"}
        />

        <div className="mt-2.5 flex items-center gap-3 text-xs text-fg-2">
          <span className="inline-flex items-center gap-1.5 rounded bg-muted px-2 py-1 text-accent">
            <Icon name="sparkles" size={11} />
            Sample week — replace it with your own
          </span>
          <button
            onClick={() => setText("")}
            className="text-fg-2 underline-offset-2 transition-colors hover:text-fg hover:underline"
          >
            Clear
          </button>
          <span className="ml-auto tabular-nums">{lineCount} lines</span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3 border-t border-line px-6 py-4">
        <p className="flex-1 text-xs text-fg-2">
          Coming from Harvest, Clockify or another tracker?{" "}
          <span className="text-accent underline-offset-2 hover:underline">
            Import a CSV instead
          </span>
        </p>
        <Button variant="accent" onClick={onContinue} disabled={!lineCount}>
          Continue
        </Button>
      </div>
    </>
  );
}

/* ---------------- Step 2: review + attach value ---------------- */

function ReviewStep({
  rows,
  clients,
  ratedClients,
  rates,
  setRates,
  minutesByClient,
  totalMinutes,
  amount,
  unreadable,
  updateRow,
  removeRow,
  onBack,
  onConfirm,
}: {
  rows: ParsedRow[];
  clients: string[];
  ratedClients: string[];
  rates: Record<string, string>;
  setRates: (v: Record<string, string>) => void;
  minutesByClient: Map<string, number>;
  totalMinutes: number;
  amount: number;
  unreadable: number;
  updateRow: (id: string, patch: Partial<ParsedRow>) => void;
  removeRow: (id: string) => void;
  onBack: () => void;
  onConfirm: () => void;
}) {
  const byDay = useMemo(() => {
    const groups = new Map<number | null, ParsedRow[]>();
    for (const r of rows) {
      const list = groups.get(r.day) ?? [];
      list.push(r);
      groups.set(r.day, list);
    }
    return [...groups.entries()].sort((a, b) => (a[0] ?? 99) - (b[0] ?? 99));
  }, [rows]);

  const unassignedMinutes = minutesByClient.get(UNASSIGNED) ?? 0;

  return (
    <>
      <div className="px-6 pt-3 pb-4">
        <h2 className="text-xl font-semibold text-fg">Here's your week</h2>
        <p className="mt-1.5 text-sm text-fg-2">
          We read {rows.length} {rows.length === 1 ? "entry" : "entries"} across{" "}
          {ratedClients.length}{" "}
          {ratedClients.length === 1 ? "client" : "clients"}. Fix anything that
          looks wrong — then tell us what these clients are worth.
        </p>
        {unreadable > 0 && (
          <p className="mt-2 inline-flex items-center gap-1.5 rounded bg-warning-fg/10 px-2 py-1 text-xs text-warning-fg">
            {unreadable} {unreadable === 1 ? "line" : "lines"} we couldn't fully
            read — marked below
          </p>
        )}
      </div>

      <div className="flex min-h-0 flex-1 gap-6 overflow-hidden px-6 pb-4">
        {/* the week */}
        <div className="min-w-0 flex-1 overflow-y-auto pr-1">
          {byDay.map(([day, dayRows]) => {
            const dayMinutes = dayRows.reduce(
              (s, r) => s + (r.minutes ?? 0),
              0,
            );
            return (
              <section key={String(day)} className="mb-4">
                <div className="mb-1.5 flex items-baseline gap-2">
                  <h3 className="text-sm font-semibold text-fg">
                    {day === null ? "Couldn't read a day" : DAY_NAMES[day]}
                  </h3>
                  {day !== null && (
                    <span className="text-xs text-fg-2">
                      {dateOfDay(day).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  )}
                  <span className="ml-auto text-xs font-medium tabular-nums text-fg-2">
                    {formatMinutes(dayMinutes)}
                  </span>
                </div>

                <div className="space-y-1">
                  {dayRows.map((row) => (
                    <RowEditor
                      key={row.id}
                      row={row}
                      clients={clients}
                      onChange={(patch) => updateRow(row.id, patch)}
                      onRemove={() => removeRow(row.id)}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        {/* value panel */}
        <aside className="flex w-72 shrink-0 flex-col overflow-hidden rounded-lg border border-line bg-surface-2">
          <div className="border-b border-line px-4 py-3">
            <h3 className="text-sm font-semibold text-fg">
              What do you bill these clients?
            </h3>
            <p className="mt-1 text-xs text-fg-2">
              Optional — skip it and you'll still get hours per client.
            </p>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {ratedClients.map((client, i) => (
              <div key={client}>
                <div className="mb-1.5 flex items-center gap-2">
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{
                      backgroundColor:
                        PROJECT_COLORS[i % PROJECT_COLORS.length],
                    }}
                  />
                  <span className="min-w-0 flex-1 truncate text-sm text-fg">
                    {client}
                  </span>
                  <span className="text-xs tabular-nums text-fg-2">
                    {formatMinutes(minutesByClient.get(client) ?? 0)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="relative flex-1">
                    <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-xs text-fg-2">
                      $
                    </span>
                    <input
                      type="number"
                      min="0"
                      inputMode="decimal"
                      value={rates[client] ?? ""}
                      onChange={(e) =>
                        setRates({ ...rates, [client]: e.target.value })
                      }
                      placeholder="—"
                      aria-label={`Hourly rate for ${client}`}
                      className="h-8 w-full rounded-md border border-line bg-surface pr-2 pl-6 text-sm tabular-nums text-fg outline-none transition-colors focus:border-accent"
                    />
                  </div>
                  <span className="text-xs text-fg-2">/hr</span>
                </div>
              </div>
            ))}

            {unassignedMinutes > 0 && (
              <div className="flex items-center gap-2 border-t border-line pt-3">
                <span className="size-2 shrink-0 rounded-full bg-fg-3" />
                <span className="flex-1 truncate text-sm text-fg-2">
                  No client
                </span>
                <span className="text-xs tabular-nums text-fg-3">
                  {formatMinutes(unassignedMinutes)}
                </span>
              </div>
            )}
          </div>

          <div className="border-t border-line px-4 py-3">
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-fg-2">Total tracked</span>
              <span className="text-sm font-semibold tabular-nums text-fg">
                {formatMinutes(totalMinutes)}
              </span>
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-xs text-fg-2">Billable</span>
              <span
                className={cx(
                  "text-2xl font-semibold tabular-nums transition-colors",
                  amount > 0 ? "text-success-fg" : "text-fg-3",
                )}
              >
                ${formatMoney(amount)}
              </span>
            </div>
          </div>
        </aside>
      </div>

      <div className="flex shrink-0 items-center gap-3 border-t border-line px-6 py-4">
        <Button onClick={onBack}>Back</Button>
        <div className="flex-1" />
        <Button variant="accent" onClick={onConfirm} disabled={!rows.length}>
          Add {formatMinutes(totalMinutes)} to my week
        </Button>
      </div>
    </>
  );
}

/* ---------------- one editable row ---------------- */

function RowEditor({
  row,
  clients,
  onChange,
  onRemove,
}: {
  row: ParsedRow;
  clients: string[];
  onChange: (patch: Partial<ParsedRow>) => void;
  onRemove: () => void;
}) {
  const [duration, setDuration] = useState(
    row.minutes != null ? formatMinutes(row.minutes) : "",
  );

  const commitDuration = () => {
    const m = duration.trim().match(/^(?:(\d+)\s*h)?\s*(?:(\d+)\s*m)?$/i);
    if (m && (m[1] || m[2])) {
      const mins = (parseInt(m[1] ?? "0", 10) || 0) * 60 + (parseInt(m[2] ?? "0", 10) || 0);
      onChange({ minutes: mins, needsAttention: row.day === null });
    } else {
      const bare = parseFloat(duration.replace(",", "."));
      if (isFinite(bare)) {
        onChange({
          minutes: Math.round(bare * 60),
          needsAttention: row.day === null,
        });
      }
    }
  };

  return (
    <div
      className={cx(
        "group flex items-center gap-2 rounded-md border px-2 py-1.5 transition-colors",
        row.needsAttention
          ? "border-warning-fg/40 bg-warning-fg/5"
          : "border-transparent hover:border-line hover:bg-white/[0.02]",
      )}
    >
      <input
        value={duration}
        onChange={(e) => setDuration(e.target.value)}
        onBlur={commitDuration}
        aria-label="Duration"
        className="w-16 shrink-0 rounded border border-line bg-surface-2 px-1.5 py-1 text-center text-xs tabular-nums text-fg outline-none focus:border-accent"
      />

      <input
        value={row.description}
        onChange={(e) => onChange({ description: e.target.value })}
        aria-label="Description"
        className="min-w-0 flex-1 rounded border border-transparent bg-transparent px-1.5 py-1 text-sm text-fg outline-none focus:border-line focus:bg-surface-2"
      />

      <select
        value={row.client ?? UNASSIGNED}
        onChange={(e) =>
          onChange({
            client: e.target.value === UNASSIGNED ? null : e.target.value,
          })
        }
        aria-label="Client"
        className="w-36 shrink-0 rounded border border-line bg-surface-2 px-1.5 py-1 text-xs text-fg outline-none focus:border-accent"
      >
        <option value={UNASSIGNED}>No client</option>
        {clients.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      <button
        onClick={onRemove}
        aria-label="Remove entry"
        className="inline-flex size-6 shrink-0 items-center justify-center rounded text-fg-3 opacity-0 transition-all group-hover:opacity-100 hover:bg-white/8 hover:text-fg-2"
      >
        <Icon name="x" size={11} />
      </button>
    </div>
  );
}
