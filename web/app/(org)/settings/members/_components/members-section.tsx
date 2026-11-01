"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/card";
import { useOrgListQuery } from "@/lib/hooks/use-org-query";
import type { Member } from "@/lib/services/swantara";
import { getSwantaraService } from "@/lib/services/swantara";
import { MembersTable, toMemberRow } from "./members-table";

export function MembersSection() {
  const t = useTranslations("Settings");
  const query = useOrgListQuery<{ members: Member[] }, Record<string, never>>(
    "members",
    (organizationId) => getSwantaraService().members.list(organizationId),
  );

  const rows = (query.data?.members ?? []).map(toMemberRow);

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <Card>
        <CardHeader className="border-b">
          <CardTitle>{t("allMembers")}</CardTitle>
          <CardDescription>{t("allMembersDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <MembersTable
            members={rows}
            status={
              query.isLoading
                ? { type: "loading" }
                : query.isError
                  ? {
                      type: "error",
                      message: query.error.message,
                      onRetry: () => void query.refetch(),
                    }
                  : undefined
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
