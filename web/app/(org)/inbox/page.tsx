import { requireActiveOrgId } from "@/lib/server/active-org";
import { InboxSection } from "./_components/inbox-section";

export default async function InboxPage() {
  const id = String(await requireActiveOrgId());

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <InboxSection orgId={id} />
    </div>
  );
}
