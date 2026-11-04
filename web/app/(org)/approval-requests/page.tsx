import { requireActiveOrgId } from "@/lib/server/active-org";
import { ApprovalRequestsSection } from "./_components/approval-requests-section";

export default async function OrgApprovalRequestsPage() {
  const id = String(await requireActiveOrgId());

  return (
    <div className="mx-auto flex w-full flex-col gap-6 py-2">
      <ApprovalRequestsSection orgId={id} />
    </div>
  );
}
