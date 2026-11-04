import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { activeOrgCookieKey } from "./active-org-cookie";

export async function getActiveOrgId(): Promise<number | null> {
  const store = await cookies();
  const raw = store.get(activeOrgCookieKey)?.value;

  if (!raw) {
    return null;
  }

  const orgId = Number(raw);

  if(!Number.isSafeInteger(orgId)  || orgId < 0) {
    return null;
  }

  return orgId;
}

export async function requireActiveOrgId(): Promise<number> {
  const orgId = await getActiveOrgId();
  if (orgId == null) redirect("/onboarding");
  return orgId;
}
