import { Button, EmptyState, PageHeader } from "../components/ui";
import illustration from "../assets/manage-team-BxLGaT2K.svg";

export default function ApprovalsPage() {
  return (
    <>
      <PageHeader title="Approvals" />
      <div className="flex flex-1 flex-col border-t border-line">
        <EmptyState
          image={illustration}
          title="Review and approve timesheets"
          description={
            <>
              Let your team submit timesheets for approval — review, approve,
              and lock time in one place.
            </>
          }
        >
          <Button variant="accent">Invite members</Button>
          <Button icon="plus">New timesheet setup</Button>
        </EmptyState>
      </div>
    </>
  );
}
