import { requireActiveOrgId } from "@/lib/server/active-org";
import { InboxSection } from "./_components/inbox-section";

export default async function InboxPage() {
  const id = String(await requireActiveOrgId());

  return <InboxSection orgId={id}/>; 
}
