"use client";

import { Building2, Loader2, TriangleAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/button";
import { setActiveOrg } from "@/lib/server/active-org-actions";

export function AcceptOrganization({ orgId }: { orgId: number }) {
  const router = useRouter();
  const t = useTranslations("Onboarding");
  const [failed, setFailed] = useState(false);
  const unmountedRef = useRef(false);

  useEffect(
    () => () => {
      unmountedRef.current = true;
    },
    [],
  );

  const selectOrg = useCallback(() => {
    setFailed(false);
    setActiveOrg(orgId).then(
      () => {
        router.replace("/dashboard");
        router.refresh();
      },
      () => {
        if (!unmountedRef.current) {
           setFailed(true);
        }
      },
    );
  }, [orgId, router]);

  useEffect(() => {
    selectOrg();
  }, [selectOrg]);

  return (
    <div
      data-slot="accept-organization"
      className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-lg text-center sm:p-10"
    >
      <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        {failed ? (
          <TriangleAlert className="size-6" aria-hidden="true" />
        ) : (
          <Building2 className="size-6" aria-hidden="true" />
        )}
      </div>
      {failed ? (
        <>
          <h1 className="mt-6 font-heading text-xl leading-tight font-medium tracking-tight">
            {t("selectOrgFailed")}
          </h1>
          <Button className="mt-6 w-full" size="lg" onClick={selectOrg}>
            {t("retry")}
          </Button>
        </>
      ) : (
        <>
          <h1 className="mt-6 font-heading text-xl leading-tight font-medium tracking-tight">
            {t("openingDashboard")}
          </h1>
          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            <span>{t("choosingOrg")}</span>
          </div>
        </>
      )}
    </div>
  );
}
