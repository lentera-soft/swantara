import { requireActiveOrgId } from "@/lib/server/active-org";
import { IntegrationHub } from "./_components/integration-hub";

export default async function IntegrationPage() {
  const id = String(await requireActiveOrgId());

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <IntegrationHub orgId={id} />
    </div>
  );
}
