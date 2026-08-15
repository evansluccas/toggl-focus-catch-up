import { useMemo, useRef, useState } from "react";
import { Icon, type IconName } from "../icons";
import { Button, cx } from "../components/ui";
import {
  SAMPLE_CSV,
  SAMPLE_CSV_NAME,
  csvToRows,
  guessMapping,
  parseCsv,
  type Csv,
  type Mapping,
} from "./csv";
import type { ParsedRow } from "./parse";

/* Toggl's own importer: upload → map → (their step 3). We keep steps 1 and 2 as
   they are, and hand step 3 to the review screen, because their importer has no
   notion of a rate. */

const ENTITIES: { id: string; label: string; icon: IconName }[] = [
  { id: "members", label: "Members", icon: "members" },
  { id: "projects", label: "Projects", icon: "folder" },
  { id: "tasks", label: "Tasks", icon: "tasks" },
  { id: "time-entries", label: "Time entries", icon: "clock" },
  { id: "custom-fields", label: "Custom fields", icon: "panelRight" },
];

const FIELDS: { key: keyof Mapping; label: string; core: boolean }[] = [
  { key: "date", label: "Date", core: true },
  { key: "duration", label: "Duration", core: true },
  { key: "description", label: "Description", core: true },
  { key: "client", label: "Client", core: true },
  { key: "project", label: "Project", core: false },
  { key: "billable", label: "Billable", core: false },
];

export default function ImportWizard({
  onCancel,
  onMapped,
}: {
  onCancel: () => void;
  onMapped: (rows: ParsedRow[], fileName: string) => void;
}) {
  const [stage, setStage] = useState<"upload" | "entity" | "map">("upload");
  const [csv, setCsv] = useState<Csv | null>(null);
  const [entity, setEntity] = useState("time-entries");
  const [mapping, setMapping] = useState<Mapping | null>(null);
  const [matchExisting, setMatchExisting] = useState(true);
  const [showMore, setShowMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const loadText = (name: string, text: string) => {
    const parsed = parseCsv(name, text);
    if (!parsed.headers.length || !parsed.rows.length) {
      setError("That file has no rows we could read. Check it's a CSV export.");
      return;
    }
    setError(null);
    setCsv(parsed);
    setMapping(guessMapping(parsed.headers));
  };

  const handleFile = (file: File) => {
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("CSV only — that looks like a different file type.");
      return;
    }
    file.text().then((t) => loadText(file.name, t));
  };

  const dots = ["upload", "entity", "map"];
  const activeDot = stage === "upload" ? 0 : stage === "entity" ? 1 : 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
      <div className="flex max-h-full w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-2xl">
        {/* header: back + step dots, as Toggl has it */}
        <div className="flex shrink-0 items-center px-6 pt-5">
          {stage === "upload" ? (
            <span className="w-20" />
          ) : (
            <button
              onClick={() => setStage(stage === "map" ? "entity" : "upload")}
              className="inline-flex w-20 items-center gap-1 text-xs font-semibold tracking-wide text-fg-2 uppercase transition-colors hover:text-fg"
            >
              <Icon name="chevronLeft" size={12} />
              Back
            </button>
          )}
          <div className="flex flex-1 items-center justify-center gap-2">
            {dots.map((d, i) => (
              <span
                key={d}
                className={cx(
                  "size-1.5 rounded-full transition-colors",
                  i === activeDot ? "bg-accent" : "bg-line-2",
                )}
              />
            ))}
          </div>
          <div className="flex w-20 justify-end">
            <button
              onClick={onCancel}
              aria-label="Close"
              className="inline-flex size-7 items-center justify-center rounded-lg text-fg-2 transition-colors hover:bg-white/8 hover:text-fg"
            >
              <Icon name="x" size={14} />
            </button>
          </div>
        </div>

        {stage === "upload" && (
          <>
            <div className="px-6 pt-4 pb-5">
              <h2 className="text-xl font-semibold text-fg">Upload CSV file</h2>
              <p className="mt-1 text-[11px] font-semibold tracking-wide text-fg-2 uppercase">
                Step 1/3
              </p>
              <div className="mt-4 border-t border-line pt-4">
                <p className="text-sm text-fg-2">
                  Bring members, projects, tasks and time entries, into Toggl
                  from a CSV export
                </p>
              </div>

              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const f = e.dataTransfer.files?.[0];
                  if (f) handleFile(f);
                }}
                className="mt-4 flex flex-col items-center justify-center rounded-lg border border-line px-6 py-10 text-center"
              >
                <p className="text-base font-semibold text-accent">
                  Drop your CSV files here
                </p>
                <p className="mt-1 text-sm text-fg-2">
                  Up to 10 files, 10 MB each. CSV only.
                </p>
                <p className="my-3 text-sm text-fg-2">or</p>
                <input
                  ref={fileInput}
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFile(f);
                  }}
                />
                <Button onClick={() => fileInput.current?.click()}>
                  Choose files
                </Button>
                <button
                  onClick={() => loadText(SAMPLE_CSV_NAME, SAMPLE_CSV)}
                  className="mt-3 text-xs text-fg-2 underline-offset-2 transition-colors hover:text-accent hover:underline"
                >
                  or use a sample Harvest export
                </button>
              </div>

              {error && (
                <p className="mt-3 rounded bg-error-fg/10 px-2.5 py-1.5 text-xs text-error-fg">
                  {error}
                </p>
              )}

              {csv && (
                <div className="mt-4 overflow-hidden rounded-lg border border-line">
                  <div className="border-b border-line px-4 py-2.5 text-sm font-medium text-fg">
                    File
                  </div>
                  <div className="flex items-center gap-3 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm text-fg">{csv.name}</div>
                      <div className="text-xs text-fg-2">
                        {csv.headers.length} columns · {csv.rows.length} rows
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setCsv(null);
                        setMapping(null);
                      }}
                      aria-label="Remove file"
                      className="inline-flex size-7 items-center justify-center rounded-lg border border-line text-fg-2 transition-colors hover:border-line-2 hover:text-fg"
                    >
                      <Icon name="x" size={11} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex shrink-0 justify-end gap-3 border-t border-line px-6 py-4">
              <Button
                variant="accent"
                disabled={!csv}
                onClick={() => setStage("entity")}
              >
                Next
              </Button>
            </div>
          </>
        )}

        {stage === "entity" && (
          <>
            <div className="px-6 pt-4 pb-5">
              <h2 className="text-xl font-semibold text-fg">Map data</h2>
              <p className="mt-1 text-[11px] font-semibold tracking-wide text-fg-2 uppercase">
                Step 2/3
              </p>
              <div className="mt-4 border-t border-line pt-4">
                <p className="text-sm text-fg">
                  Select the type of data you want to import
                </p>
              </div>

              <label className="mt-4 block">
                <span className="block text-[11px] font-semibold tracking-wide text-fg-2 uppercase">
                  Apply mapping profile
                </span>
                <select
                  defaultValue=""
                  onChange={(e) => {
                    if (e.target.value === "harvest" && csv)
                      setMapping(guessMapping(csv.headers));
                  }}
                  className="mt-1.5 h-9 w-56 rounded-lg border border-line bg-surface-2 px-2.5 text-sm text-fg outline-none focus:border-accent"
                >
                  <option value="">Select</option>
                  <option value="harvest">Harvest export</option>
                </select>
              </label>

              <div className="mt-4 space-y-2">
                {ENTITIES.map((e) => {
                  const enabled = e.id === "time-entries";
                  return (
                    <button
                      key={e.id}
                      disabled={!enabled}
                      onClick={() => setEntity(e.id)}
                      title={
                        enabled
                          ? undefined
                          : "Time entries is the path this prototype maps"
                      }
                      className={cx(
                        "flex w-full items-center gap-3 rounded-lg border px-3 py-3 text-left transition-colors",
                        !enabled && "cursor-not-allowed opacity-40",
                        enabled && entity === e.id
                          ? "border-accent bg-muted"
                          : "border-line",
                        enabled && entity !== e.id && "hover:border-line-2",
                      )}
                    >
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-accent">
                        <Icon name={e.icon} size={14} />
                      </span>
                      <span className="text-sm text-fg">{e.label}</span>
                      {enabled && entity === e.id && (
                        <Icon
                          name="check"
                          size={14}
                          className="ml-auto text-accent"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex shrink-0 justify-end gap-3 border-t border-line px-6 py-4">
              <Button onClick={onCancel}>Cancel</Button>
              <Button variant="accent" onClick={() => setStage("map")}>
                Next
              </Button>
            </div>
          </>
        )}

        {stage === "map" && csv && mapping && (
          <MapColumns
            csv={csv}
            mapping={mapping}
            setMapping={setMapping}
            matchExisting={matchExisting}
            setMatchExisting={setMatchExisting}
            showMore={showMore}
            setShowMore={setShowMore}
            onCancel={onCancel}
            onContinue={() => onMapped(csvToRows(csv, mapping), csv.name)}
          />
        )}
      </div>
    </div>
  );
}

function MapColumns({
  csv,
  mapping,
  setMapping,
  matchExisting,
  setMatchExisting,
  showMore,
  setShowMore,
  onCancel,
  onContinue,
}: {
  csv: Csv;
  mapping: Mapping;
  setMapping: (m: Mapping) => void;
  matchExisting: boolean;
  setMatchExisting: (v: boolean) => void;
  showMore: boolean;
  setShowMore: (v: boolean) => void;
  onCancel: () => void;
  onContinue: () => void;
}) {
  const visible = useMemo(
    () => FIELDS.filter((f) => f.core || showMore),
    [showMore],
  );
  const ready = mapping.date && mapping.duration;

  return (
    <>
      <div className="min-h-0 flex-1 overflow-y-auto px-6 pt-4 pb-5">
        <h2 className="text-xl font-semibold text-fg">
          Map data to Time entries
        </h2>
        <p className="mt-1 text-[11px] font-semibold tracking-wide text-fg-2 uppercase">
          Step 2/3
        </p>
        <div className="mt-4 border-t border-line pt-4">
          <p className="text-sm text-fg">
            Select the CSV column you want to map to time entries in Toggl
          </p>
        </div>

        <div className="mt-4 space-y-3.5">
          {visible.map((f) => (
            <div key={f.key} className="flex items-end gap-4">
              <label className="min-w-0 flex-1">
                <span className="text-[11px] font-semibold tracking-wide text-fg-2 uppercase">
                  {f.label}
                </span>
                <select
                  value={mapping[f.key]}
                  onChange={(e) =>
                    setMapping({ ...mapping, [f.key]: e.target.value })
                  }
                  className="mt-1.5 h-9 w-full rounded-lg border border-line bg-surface-2 px-2.5 text-sm text-fg outline-none focus:border-accent"
                >
                  <option value="">Don't import</option>
                  {csv.headers.map((h) => (
                    <option key={h} value={h}>
                      {h.toUpperCase()}
                    </option>
                  ))}
                </select>
              </label>

              {f.key === "date" && (
                <label className="flex shrink-0 items-center gap-2 pb-2.5 text-sm text-fg">
                  <input
                    type="checkbox"
                    checked={matchExisting}
                    onChange={(e) => setMatchExisting(e.target.checked)}
                    className="size-4 accent-[rgb(var(--background-accent))]"
                  />
                  Use this column to match existing records
                </label>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={() => setShowMore(!showMore)}
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-fg-2 transition-colors hover:text-fg"
        >
          <Icon
            name={showMore ? "chevronDown" : "chevronRight"}
            size={12}
          />
          More properties
        </button>

        {!ready && (
          <p className="mt-4 rounded bg-warning-fg/10 px-2.5 py-1.5 text-xs text-warning-fg">
            Map a date and a duration to continue.
          </p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-3 border-t border-line px-6 py-4">
        <p className="flex-1 text-xs text-fg-2">
          Next you'll confirm the week and set what each client is worth.
        </p>
        <Button onClick={onCancel}>Cancel</Button>
        <Button variant="accent" disabled={!ready} onClick={onContinue}>
          Save &amp; continue
        </Button>
      </div>
    </>
  );
}
