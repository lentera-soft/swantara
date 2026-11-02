"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Plus, Target, Trash2, Trophy, UserRoundPlus, XCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { type ReactNode, useState } from "react";
import { toast } from "sonner";
import { ActivityTimeline } from "@/components/activity-timeline";
import { Badge } from "@/components/badge";
import { Button } from "@/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/card";
import { Checkbox } from "@/components/checkbox";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { DetailPageSkeleton } from "@/components/detail-page-skeleton";
import { DetailsList } from "@/components/details-list";
import { Input } from "@/components/input";
import { RecordLayout } from "@/components/record-layout";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/select";
import { useOrgListQuery, useOrgQuery } from "@/lib/hooks/use-org-query";
import type {
  AddBuyerRequest,
  Contact,
  CrmActivity,
  CrmLead,
  CrmProspectContact,
  CrmStage,
  CrmStageHistoryEntry,
  Member,
} from "@/lib/services/swantara";
import { getSwantaraService } from "@/lib/services/swantara";
import { formatDate, formatNumber } from "@/lib/utils";
import { humanizeKey } from "@/lib/utils/case";
import { ActivityFormDialog } from "./activity-form-dialog";
import { AdvanceStageDialog } from "./advance-stage-dialog";
import { canAdvanceStage, canLose, canPromote, canWin } from "./crm-utils";
import { LostReasonDialog } from "./lost-reason-dialog";
import { PromoteDialog } from "./promote-section";

const buyerRoles = [
  "economic_buyer",
  "champion",
  "technical",
  "influencer",
  "blocker",
  "user",
  "other",
] as const;

export function CrmRecordDetail({
  kind,
  orgId,
  id,
}: {
  kind: "lead" | "opportunity";
  orgId: string;
  id: string;
}) {
  const t = useTranslations("Crm");
  const queryClient = useQueryClient();
  const router = useRouter();
  const service = getSwantaraService();
  const numericOrgId = Number(orgId);
  const numericId = Number(id);
  const isLead = kind === "lead";
  const basePath = isLead ? "/crm/leads" : "/crm/opportunities";

  const [activityOpen, setActivityOpen] = useState(false);
  const [promoteOpen, setPromoteOpen] = useState(false);
  const [loseOpen, setLoseOpen] = useState(false);
  const [advanceOpen, setAdvanceOpen] = useState(false);
  const [contactId, setContactId] = useState("");
  const [contactSearch, setContactSearch] = useState("");
  const [memberSearch, setMemberSearch] = useState("");
  const [activityPage, setActivityPage] = useState(1);
  const [buyerRole, setBuyerRole] = useState<(typeof buyerRoles)[number]>("influencer");
  const [buyerPrimary, setBuyerPrimary] = useState(false);

  const recordQuery = useOrgQuery<CrmLead>("crmRecord", `${kind}:${id}`, async (organizationId) => {
    if (isLead) {
      const response = await service.crmLeads.get(organizationId, numericId);
      return response.prospect;
    }
    const response = await service.crmOpportunities.get(organizationId, numericId);
    return response.opportunity;
  });
  const stagesQuery = useOrgListQuery<{ stages: CrmStage[] }, Record<string, never>>(
    "crmStages",
    (organizationId) => service.crmStages.list(organizationId),
  );
  const contactParams = {
    size: 100,
    ...(contactSearch.trim() ? { filter: [`name:like:${contactSearch.trim()}`] } : {}),
  };
  const contactsQuery = useOrgListQuery<{ contacts: Contact[] }, typeof contactParams>(
    "contacts",
    (organizationId, params) => service.contacts.list(organizationId, params),
    contactParams,
  );
  const membersQuery = useOrgListQuery<{ members: Member[] }, Record<string, never>>(
    "members",
    (organizationId) => service.members.list(organizationId),
  );
  const activityParams = {
    page: activityPage,
    size: 25,
    filter: [`prospect_id:eq:${numericId}`],
  };
  const activitiesQuery = useOrgListQuery<
    { activities: CrmActivity[]; meta?: { pagination?: { page: number; totalPages: number } } },
    typeof activityParams
  >(
    "crmActivities",
    (organizationId, params) => service.crmActivities.list(organizationId, params),
    activityParams,
  );
  const historyQuery = useOrgQuery<CrmStageHistoryEntry[]>(
    "crmRecordHistory",
    `${kind}:${id}`,
    async (organizationId) => {
      const response = isLead
        ? await service.crmLeads.history(organizationId, numericId)
        : await service.crmOpportunities.history(organizationId, numericId);
      return response.history;
    },
  );
  const buyersQuery = useOrgQuery<CrmProspectContact[]>(
    "crmRecordBuyers",
    `${kind}:${id}`,
    async (organizationId) => {
      const response = isLead
        ? await service.crmLeads.listBuyers(organizationId, numericId)
        : await service.crmOpportunities.listBuyers(organizationId, numericId);
      return response.buyers;
    },
  );
  const duplicatesQuery = useOrgQuery<CrmLead[]>(
    "crmRecordDuplicates",
    `${kind}:${id}`,
    async (organizationId) => {
      if (!isLead) return [];
      const response = await service.crmLeads.duplicates(organizationId, numericId);
      return response.duplicates;
    },
    { enabled: isLead },
  );

  const record = recordQuery.data;
  const stages = stagesQuery.data?.stages ?? [];
  const contacts = contactsQuery.data?.contacts ?? [];
  const members = (membersQuery.data?.members ?? []).filter((member) => {
    const term = memberSearch.trim().toLowerCase();
    if (!term) return true;
    const user = member.user;
    const label = [user?.firstName, user?.lastName, user?.email, member.position]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return label.includes(term);
  });
  const activities = activitiesQuery.data?.activities ?? [];
  const activityTotalPages = activitiesQuery.data?.meta?.pagination?.totalPages ?? 1;
  const history = historyQuery.data ?? [];
  const buyers = buyersQuery.data ?? [];
  const duplicates = duplicatesQuery.data ?? [];

  const stageMap = new Map(stages.map((stage) => [stage.id, stage.name]));
  const contactMap = new Map(contacts.map((contact) => [contact.id, contact]));
  const linkedActivities = [...activities].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  function refresh() {
    void recordQuery.refetch();
    void historyQuery.refetch();
    void buyersQuery.refetch();
    void duplicatesQuery.refetch();
    void queryClient.invalidateQueries({ queryKey: ["crmRecord"] });
    void queryClient.invalidateQueries({ queryKey: ["crmRecordHistory"] });
    void queryClient.invalidateQueries({ queryKey: ["crmRecordBuyers"] });
    void queryClient.invalidateQueries({ queryKey: ["crmRecordDuplicates"] });
    void queryClient.invalidateQueries({ queryKey: ["crmLeads"] });
    void queryClient.invalidateQueries({ queryKey: ["crmOpportunities"] });
  }

  const addBuyerMutation = useMutation({
    mutationFn: (input: AddBuyerRequest) =>
      isLead
        ? service.crmLeads.addBuyer(numericOrgId, numericId, input)
        : service.crmOpportunities.addBuyer(numericOrgId, numericId, input),
    onSuccess: () => {
      toast.success(t("buyerAdded"));
      setContactId("");
      setBuyerPrimary(false);
      refresh();
    },
    onError: () => toast.error(t("saveFailed")),
  });

  const removeBuyerMutation = useMutation({
    mutationFn: (buyerId: number) =>
      isLead
        ? service.crmLeads.removeBuyer(numericOrgId, numericId, buyerId)
        : service.crmOpportunities.removeBuyer(numericOrgId, numericId, buyerId),
    onSuccess: () => {
      toast.success(t("buyerRemoved"));
      refresh();
    },
    onError: () => toast.error(t("saveFailed")),
  });

  const reassignOwnerMutation = useMutation({
    mutationFn: async (ownerUserId: number | null) => {
      if (isLead) {
        const response = await service.crmLeads.reassignOwner(numericOrgId, numericId, {
          ownerUserId,
        });
        return response.prospect;
      }
      const response = await service.crmOpportunities.reassignOwner(numericOrgId, numericId, {
        ownerUserId,
      });
      return response.opportunity;
    },
    onSuccess: () => {
      toast.success(t("updated"));
      refresh();
    },
    onError: () => toast.error(t("saveFailed")),
  });

  const mergeMutation = useMutation({
    mutationFn: (sourceId: number) =>
      service.crmLeads.merge(numericOrgId, sourceId, { targetId: numericId }),
    onSuccess: () => {
      toast.success(t("merged"));
      refresh();
    },
    onError: () => toast.error(t("saveFailed")),
  });

  const winMutation = useMutation({
    mutationFn: () => service.crmOpportunities.win(numericOrgId, numericId),
    onSuccess: () => {
      toast.success(t("markedWon"));
      refresh();
    },
    onError: () => toast.error(t("saveFailed")),
  });

  function statusLabel(value: string): string {
    try {
      return (t as unknown as (key: string) => string)(`status.${value}`);
    } catch {
      return humanizeKey(value);
    }
  }

  function stageName(stageId: number | null): string {
    if (stageId == null) return t("noStage");
    return stageMap.get(stageId) ?? String(stageId);
  }

  if (recordQuery.isLoading) {
    return <DetailPageSkeleton />;
  }

  if (recordQuery.error) {
    return <p className="text-sm text-destructive">{recordQuery.error.message}</p>;
  }

  if (!record) {
    return <p className="text-sm text-muted-foreground">{t("recordNotFound")}</p>;
  }

  const profileItems = [
    { id: "status", label: t("fieldStatus"), value: statusLabel(record.status) },
    { id: "stage", label: t("tableStage"), value: stageName(record.stageId) },
    {
      id: "owner",
      label: t("ownerLabel"),
      value: record.ownerUserId ? `#${record.ownerUserId}` : t("unassignedOwner"),
    },
    {
      id: "contact",
      label: t("tableContact"),
      value: record.contactName ?? record.email ?? "—",
    },
    { id: "email", label: t("fieldEmail"), value: record.email ?? "—" },
    { id: "phone", label: t("fieldPhone"), value: record.phone ?? "—" },
    { id: "source", label: t("fieldSource"), value: record.source ?? t("sourceUnknown") },
    { id: "medium", label: t("fieldMedium"), value: record.medium ?? "—" },
    { id: "campaign", label: t("fieldCampaign"), value: record.campaign ?? "—" },
    {
      id: "revenue",
      label: t("tableExpectedRevenue"),
      value: formatNumber(record.expectedRevenue),
    },
    { id: "probability", label: t("tableProbability"), value: `${record.probability}%` },
    {
      id: "expectedClose",
      label: t("expectedCloseLabel"),
      value: record.expectedClose ? formatDate(record.expectedClose) : "—",
    },
    {
      id: "nextStep",
      label: t("fieldNextStep"),
      value: record.nextStep ?? t("nextStepEmpty"),
    },
    {
      id: "nextStepDue",
      label: t("fieldNextStepDue"),
      value: record.nextStepDue ? formatDate(record.nextStepDue) : "—",
    },
    {
      id: "consent",
      label: t("sectionConsent"),
      value: record.doNotContact
        ? t("doNotContactLabel")
        : record.consentGranted
          ? t("consentGrantedLabel")
          : t("consentWithheldLabel"),
    },
    {
      id: "firstContacted",
      label: t("firstContactedLabel"),
      value: record.firstContactedAt ? formatDate(record.firstContactedAt) : "—",
    },
    {
      id: "lastActivity",
      label: t("lastActivityLabel"),
      value: record.lastActivityAt ? formatDate(record.lastActivityAt) : "—",
    },
    {
      id: "stageEntered",
      label: t("stageEnteredLabel"),
      value: record.stageEnteredAt ? formatDate(record.stageEnteredAt) : "—",
    },
  ];

  const timelineItems = linkedActivities.map((activity) => ({
    id: String(activity.id),
    title: activity.summary,
    description: activity.note ?? humanizeKey(activity.type),
    timestamp: activity.dueDate
      ? formatDate(activity.dueDate)
      : activity.doneAt
        ? formatDate(activity.doneAt)
        : formatDate(activity.createdAt),
    tone: activity.done ? ("success" as const) : ("neutral" as const),
  }));

  const historyItems = history
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map((entry) => ({
      id: String(entry.id),
      title: `${stageName(entry.fromStageId)} → ${stageName(entry.toStageId)}`,
      description:
        entry.notes ??
        [entry.fromStatus, entry.toStatus]
          .filter((value): value is string => Boolean(value))
          .join(" → "),
      timestamp: formatDate(entry.createdAt),
      tone: "neutral" as const,
    }));

  const profileTab = (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">{t("recordProfile")}</CardTitle>
          <p className="text-sm text-muted-foreground">{t("recordProfileHint")}</p>
        </CardHeader>
        <CardContent>
          <DetailsList items={profileItems} layout="grid" columns={2} />
        </CardContent>
      </Card>
      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("sectionNextStep")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm">{record.nextStep ?? t("nextStepEmpty")}</p>
            {record.nextStepDue ? (
              <p className="text-xs text-muted-foreground">{formatDate(record.nextStepDue)}</p>
            ) : null}
            <Button size="sm" variant="outline" onClick={() => setActivityOpen(true)}>
              <Plus />
              <span>{t("addActivityForRecord")}</span>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("ownerLabel")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Input
              value={memberSearch}
              onChange={(event) => setMemberSearch(event.target.value)}
              placeholder={t("searchMembersPlaceholder")}
            />
            <Select
              value={record.ownerUserId != null ? String(record.ownerUserId) : "unassigned"}
              onValueChange={(value) =>
                reassignOwnerMutation.mutate(
                  value === "unassigned" || value == null ? null : Number(value),
                )
              }
            >
              <SelectTrigger aria-label={t("ownerLabel")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">{t("unassignedOwner")}</SelectItem>
                {members.map((member) => (
                  <SelectItem key={member.id} value={String(member.userId)}>
                    {member.user
                      ? `${member.user.firstName} ${member.user.lastName ?? ""}`.trim()
                      : (member.position ?? `#${member.userId}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const timelineTab = (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <div>
          <CardTitle className="text-base">{t("recordTimeline")}</CardTitle>
          <p className="text-sm text-muted-foreground">{t("recordTimelineHint")}</p>
        </div>
        <Button size="sm" onClick={() => setActivityOpen(true)}>
          <Plus />
          <span>{t("addActivityForRecord")}</span>
        </Button>
      </CardHeader>
      <CardContent>
        {timelineItems.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("timelineEmpty")}</p>
        ) : (
          <>
            <ActivityTimeline items={timelineItems} />
            <div className="mt-4 flex items-center justify-end gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setActivityPage((current) => Math.max(1, current - 1))}
                disabled={activityPage <= 1 || activitiesQuery.isFetching}
              >
                {t("previousPage")}
              </Button>
              <span className="text-xs text-muted-foreground">
                {activityPage} / {Math.max(activityTotalPages, 1)}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setActivityPage((current) => Math.min(activityTotalPages, current + 1))
                }
                disabled={activityPage >= activityTotalPages || activitiesQuery.isFetching}
              >
                {t("nextPage")}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );

  const historyTab = (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("recordHistory")}</CardTitle>
        <p className="text-sm text-muted-foreground">{t("recordHistoryHint")}</p>
      </CardHeader>
      <CardContent>
        {historyItems.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("historyEmpty")}</p>
        ) : (
          <ActivityTimeline items={historyItems} />
        )}
      </CardContent>
    </Card>
  );

  const buyersTab = (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("recordBuyers")}</CardTitle>
        <p className="text-sm text-muted-foreground">{t("recordBuyersHint")}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {buyers.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("buyersEmpty")}</p>
        ) : (
          <ul className="divide-y divide-border rounded-md border border-border">
            {buyers.map((buyer) => {
              const contact = contactMap.get(buyer.contactId);
              return (
                <li key={buyer.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">
                      {contact?.displayName ?? contact?.name ?? `#${buyer.contactId}`}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {humanizeKey(buyer.role)}
                      {buyer.isPrimary ? ` · ${t("fieldBuyerPrimary")}` : ""}
                    </span>
                  </div>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    aria-label={t("removeBuyer")}
                    title={t("removeBuyer")}
                    disabled={removeBuyerMutation.isPending}
                    onClick={() => removeBuyerMutation.mutate(buyer.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
        <div className="flex flex-col gap-3 rounded-md border border-border p-4 sm:flex-row sm:items-end">
          <div className="flex flex-1 flex-col gap-1">
            <span className="text-xs text-muted-foreground">{t("selectContact")}</span>
            <Input
              value={contactSearch}
              onChange={(event) => setContactSearch(event.target.value)}
              placeholder={t("searchContactsPlaceholder")}
            />
            <Select value={contactId} onValueChange={(value) => setContactId(value ?? "")}>
              <SelectTrigger aria-label={t("selectContact")}>
                <SelectValue placeholder={t("selectContact")} />
              </SelectTrigger>
              <SelectContent>
                {contacts.map((contact) => (
                  <SelectItem key={contact.id} value={String(contact.id)}>
                    {contact.displayName ?? contact.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">{t("fieldBuyerRole")}</span>
            <Select
              value={buyerRole}
              onValueChange={(value) => setBuyerRole(value as (typeof buyerRoles)[number])}
            >
              <SelectTrigger aria-label={t("fieldBuyerRole")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {buyerRoles.map((role) => (
                  <SelectItem key={role} value={role}>
                    {humanizeKey(role)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <label htmlFor="buyer-primary" className="flex items-center gap-2 text-sm">
            <Checkbox
              id="buyer-primary"
              checked={buyerPrimary}
              onCheckedChange={(checked) => setBuyerPrimary(Boolean(checked))}
            />
            {t("fieldBuyerPrimary")}
          </label>
          <Button
            size="sm"
            disabled={!contactId || addBuyerMutation.isPending}
            onClick={() =>
              addBuyerMutation.mutate({
                contactId: Number(contactId),
                role: buyerRole,
                isPrimary: buyerPrimary,
              })
            }
          >
            <UserRoundPlus />
            <span>{t("addBuyer")}</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const duplicatesTab = isLead ? (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("recordDuplicates")}</CardTitle>
        <p className="text-sm text-muted-foreground">{t("recordDuplicatesHint")}</p>
      </CardHeader>
      <CardContent>
        {duplicates.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("duplicatesEmpty")}</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {duplicates.map((duplicate) => (
              <li
                key={duplicate.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border px-4 py-3"
              >
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{duplicate.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {duplicate.email ?? "—"} · {statusLabel(duplicate.status)}
                  </span>
                </div>
                <ConfirmDialog
                  title={t("mergeConfirmTitle")}
                  description={t("mergeConfirmDescription")}
                  confirmLabel={t("mergeIntoThis")}
                  loading={mergeMutation.isPending}
                  onConfirm={() => mergeMutation.mutate(duplicate.id)}
                  trigger={
                    <Button size="sm" variant="outline">
                      {t("mergeIntoThis")}
                    </Button>
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  ) : null;

  const tabs: { id: string; label: string; content: ReactNode }[] = [
    { id: "profile", label: t("recordProfile"), content: profileTab },
    { id: "timeline", label: t("recordTimeline"), content: timelineTab },
    { id: "history", label: t("recordHistory"), content: historyTab },
    { id: "buyers", label: t("recordBuyers"), content: buyersTab },
  ];
  if (isLead) {
    tabs.push({ id: "duplicates", label: t("recordDuplicates"), content: duplicatesTab ?? null });
  }

  return (
    <>
      <RecordLayout
        breadcrumbItems={[
          { label: isLead ? t("leadsTitle") : t("opportunitiesTitle"), href: basePath },
          { label: record.name },
        ]}
        title={record.name}
        description={record.needSummary ?? undefined}
        status={
          <Badge variant={record.isWon ? "default" : record.isLost ? "outline" : "secondary"}>
            {statusLabel(record.status)}
          </Badge>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {isLead && canPromote(record) ? (
              <Button size="sm" onClick={() => setPromoteOpen(true)} disabled={promoteOpen}>
                <Target />
                <span>{t("promoteToOpportunity")}</span>
              </Button>
            ) : null}
            {!isLead && canAdvanceStage(record) ? (
              <Button size="sm" variant="outline" onClick={() => setAdvanceOpen(true)}>
                <ArrowRight />
                <span>{t("advanceStage")}</span>
              </Button>
            ) : null}
            {!isLead && canWin(record) ? (
              <Button
                size="sm"
                onClick={() => winMutation.mutate()}
                disabled={winMutation.isPending}
              >
                <Trophy />
                <span>{t("markWon")}</span>
              </Button>
            ) : null}
            {!isLead && canLose(record) ? (
              <Button size="sm" variant="outline" onClick={() => setLoseOpen(true)}>
                <XCircle />
                <span>{t("markLost")}</span>
              </Button>
            ) : null}
            <Button size="sm" variant="outline" asChild>
              <Link href={`${basePath}/${record.id}/edit`}>
                {isLead ? t("editLead") : t("editOpportunity")}
              </Link>
            </Button>
          </div>
        }
        tabs={tabs}
      />
      {promoteOpen ? (
        <PromoteDialog
          open={promoteOpen}
          onOpenChange={setPromoteOpen}
          orgId={orgId}
          prospectId={String(record.id)}
          initial={record}
          onPromoted={() => {
            setPromoteOpen(false);
            refresh();
            router.push(`/crm/opportunities/${record.id}`);
          }}
        />
      ) : null}
      {advanceOpen ? (
        <AdvanceStageDialog
          open={advanceOpen}
          onOpenChange={setAdvanceOpen}
          orgId={orgId}
          opportunityId={String(record.id)}
          currentStageId={record.stageId}
          onDone={() => {
            setAdvanceOpen(false);
            refresh();
          }}
        />
      ) : null}
      {loseOpen ? (
        <LostReasonDialog
          open={loseOpen}
          onOpenChange={setLoseOpen}
          orgId={orgId}
          opportunityId={String(record.id)}
          onDone={() => {
            setLoseOpen(false);
            refresh();
          }}
        />
      ) : null}
      {activityOpen ? (
        <ActivityFormDialog
          open={activityOpen}
          onOpenChange={setActivityOpen}
          orgId={orgId}
          defaultProspectId={String(record.id)}
          onSave={() => {
            setActivityOpen(false);
            refresh();
            void queryClient.invalidateQueries({ queryKey: ["crmActivities"] });
          }}
        />
      ) : null}
    </>
  );
}
