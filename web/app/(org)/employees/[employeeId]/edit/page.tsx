import { getTranslations } from "next-intl/server";
import { BackLink } from "@/components/back-link";
import { requireActiveOrgId } from "@/lib/server/active-org";
import { EmployeeFormEdit } from "../../_components/employee-form";

export default async function OrgEditEmployeePage({
  params,
}: {
  params: Promise<{ employeeId: string }>;
}) {
  const t = await (getTranslations as unknown as (ns: string) => Promise<(key: string) => string>)(
    "Employees",
  );
  const { employeeId } = await params;
  const id = String(await requireActiveOrgId());

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <BackLink href={`/employees/${employeeId}`}>{t("backToEmployees")}</BackLink>
      <EmployeeFormEdit orgId={id} employeeId={employeeId} />
    </div>
  );
}
