import { Button, IconButton, PageHeader } from "../components/ui";

const members = [
  {
    id: "u1",
    name: "Evansluccas",
    initials: "EV",
    role: "Organization Owner",
    taken: 0,
    booked: 0,
    rate: "None",
    cost: "None",
    hours: "–",
  },
];

export default function MembersPage() {
  return (
    <>
      <PageHeader
        title="Members"
        actions={
          <Button variant="accent" icon="send">
            Invite members
          </Button>
        }
      />

      <div className="flex h-12 shrink-0 items-center gap-2 px-6">
        <Button icon="members" trailingIcon="chevronDown">
          People
        </Button>
        <Button icon="filter">Filters</Button>
        <div className="ml-auto">
          <IconButton name="search" aria-label="Search members" />
        </div>
      </div>

      <div className="flex-1 overflow-auto px-6 pb-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-[11px] font-semibold tracking-wide text-fg-2 uppercase">
              <th className="px-3 py-2.5 text-left">Member</th>
              <th className="px-3 py-2.5 text-left">Role</th>
              <th className="px-3 py-2.5 text-left">Time off</th>
              <th className="px-3 py-2.5 text-left">Rate</th>
              <th className="px-3 py-2.5 text-left">Cost</th>
              <th className="px-3 py-2.5 text-right">Working hours</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr
                key={m.id}
                className="border-b border-line/60 hover:bg-white/[0.03]"
              >
                <td className="px-3 py-3">
                  <span className="flex items-center gap-2.5">
                    <span className="flex size-6 items-center justify-center rounded-full bg-muted-active text-[10px] font-semibold text-accent-active">
                      {m.initials}
                    </span>
                    <span className="font-medium text-fg">{m.name}</span>
                  </span>
                </td>
                <td className="px-3 py-3 text-fg-2 italic">{m.role}</td>
                <td className="px-3 py-3">
                  <div className="text-fg">{m.taken} days taken</div>
                  <div className="text-xs text-fg-2">{m.booked} days booked</div>
                </td>
                <td className="px-3 py-3 text-fg-2">{m.rate}</td>
                <td className="px-3 py-3 text-fg-2">{m.cost}</td>
                <td className="px-3 py-3 text-right text-fg-2">{m.hours}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mx-auto mt-10 flex max-w-lg items-center gap-4 rounded-xl border border-line bg-surface-2/60 p-5">
          <div className="flex -space-x-2">
            {["EV", "AB", "CD"].map((i, n) => (
              <span
                key={i}
                className="flex size-8 items-center justify-center rounded-full border-2 border-surface text-[10px] font-semibold"
                style={{
                  background: n === 0 ? "rgb(var(--background-muted-active))" : "rgb(var(--background-dark))",
                  color: n === 0 ? "rgb(var(--background-accent-active))" : "rgb(var(--foreground-secondary))",
                }}
              >
                {i}
              </span>
            ))}
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-semibold text-fg">
              Set rates and costs per person
            </h2>
            <p className="mt-0.5 text-xs text-fg-2">
              Invite your team to calculate profitability.
            </p>
          </div>
          <Button>Invite members</Button>
        </div>
      </div>
    </>
  );
}
