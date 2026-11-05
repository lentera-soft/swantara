"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/card";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { DetailPageSkeleton } from "@/components/detail-page-skeleton";
import { DetailsList } from "@/components/details-list";
import { useOrgListQuery, useOrgQuery } from "@/lib/hooks/use-org-query";
import type { Contact, SalesGroup } from "@/lib/services/swantara";
import { getSwantaraService } from "@/lib/services/swantara";
import { formatDate } from "@/lib/utils";

export function TeamDetailSection({ orgId, teamId }: { orgId: string; teamId: string }) {
  const t = useTranslations("Crm");
  const tCommon = useTranslations("Common");
  const router = useRouter();
  const queryClient = useQueryClient();
  const numericId = Number(teamId);

  const teamQuery = useOrgQuery<{ team: SalesGroup }>("crmTeam", teamId, (organizationId) =>
    getSwantaraService().salesGroups.get(organizationId, numericId),
  );
  const contactsQuery = useOrgListQuery<{ contacts: Contact[] }, Record<string, never>>(
    "contacts",
    (organizationId) => getSwantaraService().contacts.list(organizationId),
  );

  const deleteMutation = useMutation({
    mutationFn: () => getSwantaraService().salesGroups.delete(Number(orgId), numericId),
    onSuccess: () => {
      toast.success(t("teamDeleted"));
      void queryClient.invalidateQueries({ queryKey: ["salesGroups"] });
      router.push("/crm/teams");
    },
    onError: () => toast.error(t("deleteTeamFailed")),
  });

  if (teamQuery.isLoading || Number.isNaN(numericId)) {
    return <DetailPageSkeleton />;
  }

  if (teamQuery.isError || !teamQuery.data?.team) {
    return (
      <Card>
        <CardContent className="flex flex-col items-start gap-3">
          <p className="text-sm text-destructive">
            {teamQuery.error?.message ?? t("teamNotFound")}
          </p>
          <Button variant="outline" size="sm" asChild>
            <a href="/crm/teams">{t("backToTeams")}</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const team = teamQuery.data.team;
  const leader =
    team.leaderId == null
      ? null
      : (contactsQuery.data?.contacts ?? []).find((contact) => contact.id === team.leaderId);
  const leaderName =
    team.leaderId == null
      ? t("teamNoLeader")
      : (leader?.displayName ?? leader?.name ?? `#${team.leaderId}`);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-heading text-2xl leading-tight tracking-tight">{team.name}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" asChild>
            <a href={`/crm/teams/${team.id}/edit`}>
              <Pencil aria-hidden />
              {t("editTeam")}
            </a>
          </Button>
          <ConfirmDialog
            title={t("deleteTeamTitle")}
            description={t("deleteTeamDescription")}
            confirmLabel={tCommon("delete")}
            loading={deleteMutation.isPending}
            onConfirm={() => deleteMutation.mutate()}
            trigger={
              <Button size="sm" variant="outline">
                <Trash2 aria-hidden />
                {tCommon("delete")}
              </Button>
            }
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("teamDetails")}</CardTitle>
        </CardHeader>
        <CardContent>
          <DetailsList
            items={[
              { id: "name", label: t("fieldName"), value: team.name },
              { id: "leader", label: t("teamLeader"), value: leaderName },
              { id: "created", label: t("created"), value: formatDate(String(team.createdAt)) },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
