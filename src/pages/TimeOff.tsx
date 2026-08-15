import { Button, PageHeader } from "../components/ui";
import { Icon, type IconName } from "../icons";
import illustration from "../assets/time-off-module-upsell-dark-CDpcYyuw.svg";

const perks: { icon: IconName; label: string }[] = [
  { icon: "reports", label: "Track balances & accruals" },
  { icon: "calendar", label: "See who's available before you plan work" },
  { icon: "approvals", label: "Approve time off requests—or auto-approve" },
];

export default function TimeOffPage() {
  return (
    <>
      <PageHeader title="Time off" />
      <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto border-t border-line px-6 py-10 text-center">
        <img src={illustration} alt="" className="mb-8 w-[340px]" />

        <h2 className="text-xl font-semibold text-fg">
          Time off that powers capacity planning
        </h2>
        <p className="mt-2 max-w-xl text-sm text-fg-2">
          Manage time off where you plan and track work, with approved leave
          automatically reflected in team capacity.
        </p>

        <ul className="mt-6 w-full max-w-md space-y-3 rounded-xl border border-line p-5 text-left">
          {perks.map((p) => (
            <li key={p.label} className="flex items-center gap-3 text-sm text-fg">
              <Icon name={p.icon} className="shrink-0 text-accent" />
              {p.label}
            </li>
          ))}
        </ul>

        <Button variant="accent" className="mt-6">
          Start 30-day free trial
        </Button>
        <p className="mt-2 text-xs text-fg-2">
          <span className="font-semibold text-fg">$2/user/month</span> billed
          annually
        </p>
      </div>
    </>
  );
}
