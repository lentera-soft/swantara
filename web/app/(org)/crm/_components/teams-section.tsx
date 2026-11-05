"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { LegacyColumnDef as ColumnDef } from "@tanstack/react-table/legacy";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { toast } from "sonner";
import { InteractiveEntityTable } from "@/app/(org)/_components/interactive-entity-table";
import { RowActions } from "@/app/(org)/_components/row-actions";
import { Button } from "@/components/button";
import { useOrgListQuery } from "@/lib/hooks/use-org-query";
import type { Contact, SalesGroup } from "@/lib/services/swantara";
import { getSwantaraService } from "@/lib/services/swantara";
import { logger } from "@/lib/utils/client-logger";

type TeamRow = SalesGroup & { leaderName: string };

export function TeamsSection({ orgId }: { orgId: string }) {
  const t = useTranslations("Crm");
  const tCommon = useTranslations("Common");
  const router = useRouter();
  const queryClient = useQueryClient();

  const teamsQuery = useOrgListQuery<{ teams: SalesGroup[] }, Record<string, never>>(
    "salesGroups",
    (organizationId) => getSwantaraService().salesGroups.list(organizationId),
  );
  const contactsQuery = useOrgListQuery<{ contacts: Contact[] }, Record<string, never>>(
    "contacts",
    (organizationId) => getSwantaraService().contacts.list(organizationId),
  );

  const teams = useMemo<TeamRow[]>(() => {
    const contactNames = new Map<number, string>(
      (contactsQuery.data?.contacts ?? []).map((contact) => [
        contact.id,
        contact.displayName || contact.name,
      ]),
    );

    return (teamsQuery.data?.teams ?? []).map((team) => ({
      ...team,
      leaderName:
        team.leaderId == null
          ? t("teamNoLeader")
          : (contactNames.get(team.leaderId) ?? `#${team.leaderId}`),
    }));
  }, [contactsQuery.data, teamsQuery.data, t]);

  const deleteMutation = useMutation({
    mutationFn: (id: number) => getSwantaraService().salesGroups.delete(Number(orgId), id),
    onSuccess: () => {
      toast.success(t("teamDeleted"));
      void queryClient.invalidateQueries({ queryKey: ["salesGroups"] });
    },
    onError: (error) => {
      logger.error({ err: error }, "Failed to delete sales team");
      toast.error(t("deleteTeamFailed"));
    },
  });

  const columns: ColumnDef<TeamRow>[] = [
    {
      accessorKey: "name",
      header: t("fieldName"),
      cell: ({ row }) => (
        <Link
          href={`/crm/teams/${row.original.id}`}
          className="rounded font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {row.original.name}
        </Link>
      ),
    },
    {
      accessorKey: "leaderName",
      header: t("teamLeader"),
      cell: ({ row }) => (
        <span className={row.original.leaderId == null ? "text-muted-foreground" : undefined}>
          {row.original.leaderName}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <RowActions
          editLabel={tCommon("edit")}
          deleteLabel={tCommon("delete")}
          confirmTitle={t("deleteTeamTitle")}
          confirmDescription={t("deleteTeamDescription")}
          onEdit={() => router.push(`/crm/teams/${row.original.id}/edit`)}
          onDelete={() => deleteMutation.mutate(row.original.id)}
        />
      ),
    },
  ];

  return (
    <InteractiveEntityTable
      columns={columns}
      data={teams}
      getRowId={(row) => String(row.id)}
      searchKeys={["name", "leaderName"]}
      searchPlaceholder={t("searchTeamsPlaceholder")}
      filterLabel=""
      statusOptions={[]}
      allLabel=""
      ariaLabel={t("teamsTitle")}
      emptyTitle={t("emptyTeams")}
      emptyDescription={t("emptyTeamsDescription")}
      exportFileName="sales-teams"
      actions={
        <Button size="sm" asChild>
          <Link href="/crm/teams/new">
            <Plus aria-hidden />
            <span>{t("addTeam")}</span>
          </Link>
        </Button>
      }
      status={
        teamsQuery.isLoading
          ? { type: "loading" }
          : teamsQuery.isError
            ? {
                type: "error",
                message: teamsQuery.error.message,
                onRetry: () => void teamsQuery.refetch(),
              }
            : undefined
      }
    />
  );
}
