import { getTranslations } from "next-intl/server";
import { BackLink } from "@/components/back-link";
import { requireActiveOrgId } from "@/lib/server/active-org";
import { EmployeeForm } from "../_components/employee-form";

export default async function OrgNewEmployeePage() {
  const t = await (getTranslations as unknown as (ns: string) => Promise<(key: string) => string>)(
    "Employees",
  );
  const id = String(await requireActiveOrgId());

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <BackLink href="/employees">{t("backToEmployees")}</BackLink>
      <EmployeeForm orgId={id} />
    </div>
  );
}
