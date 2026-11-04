import { redirect } from "next/navigation";

import { createServerSwantaraService } from "@/lib/server/api-client";
import { SwantaraError } from "@/lib/services/swantara/errors";
import { AcceptOrganization } from "./_components/accept-organization";
import OnboardingForm from "./_components/onboarding-form";
import { OnboardingShell } from "./_components/onboarding-shell";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const service = await createServerSwantaraService();
  let organizations: Awaited<ReturnType<typeof service.me.organizations>>["organizations"];
  try {
    ({ organizations } = await service.me.organizations());
  } catch (error) {
    if (error instanceof SwantaraError && (error.status === 401 || error.status >= 500)) {
      redirect("/api/v1/auth/session?next=/onboarding");
    }
    throw error;
  }
  const validOrganizations = (organizations ?? []).filter((org): org is NonNullable<typeof org> =>
    Boolean(org),
  );

  if (validOrganizations.length > 0) {
    return (
      <OnboardingShell>
        <AcceptOrganization orgId={validOrganizations[0]!.id} />
      </OnboardingShell>
    );
  }

  return (
    <OnboardingShell>
      <OnboardingForm />
    </OnboardingShell>
  );
}
