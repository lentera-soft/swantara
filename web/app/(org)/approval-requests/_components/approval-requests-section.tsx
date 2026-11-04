"use client";

import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/badge";
import { Button } from "@/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/dialog";
import { Input } from "@/components/input";
import { Skeleton } from "@/components/skeleton";
import { Textarea } from "@/components/textarea";
import { useOrgListQuery, useOrgQuery } from "@/lib/hooks/use-org-query";
import type { ApprovalRequest, ApprovalStep } from "@/lib/services/swantara";
import { getSwantaraService } from "@/lib/services/swantara";
import { formatDate } from "@/lib/utils";
import { humanizeKey } from "@/lib/utils/case";

type StateFilter = "all" | "pending" | "approved" | "refused";
type PendingDecision = { step: ApprovalStep; approve: boolean };

const stateStripe: Record<string, string> = {
  pending: "border-l-warning",
  approved: "border-l-success",
  refused: "border-l-destructive",
};

const stateBadge: Record<string, string> = {
  pending: "border-warning text-warning",
  approved: "border-success text-success",
  refused: "border-destructive text-destructive",
};

const decisionBadge: Record<string, string> = {
  pending: "border-info text-info",
  approved: "border-success text-success",
  refused: "border-destructive text-destructive",
};

export function ApprovalRequestsSection({ orgId }: { orgId: string }) {
  const t = useTranslations("ApprovalRequests");
  const tCommon = useTranslations("Common");
  const [filter, setFilter] = useState<StateFilter>("all");
  const [search, setSearch] = useState("");

  const listQuery = useOrgListQuery<{ approvalRequests: ApprovalRequest[] }, Record<string, never>>(
    "approvalRequests",
    (organizationId) => getSwantaraService().approvalRequests.list(organizationId),
  );

  const requests = useMemo(() => listQuery.data?.approvalRequests ?? [], [listQuery.data]);

  const counts = useMemo(
    () => ({
      all: requests.length,
      pending: requests.filter((r) => r.state === "pending").length,
      approved: requests.filter((r) => r.state === "approved").length,
      refused: requests.filter((r) => r.state === "refused").length,
    }),
    [requests],
  );

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return requests
      .filter((r) => filter === "all" || r.state === filter)
      .filter(
        (r) =>
          !q ||
          r.ownerType.toLowerCase().includes(q) ||
          String(r.ownerId).includes(q) ||
          String(r.id).includes(q),
      );
  }, [requests, filter, search]);

  const filters: StateFilter[] = ["all", "pending", "approved", "refused"];

  function filterLabel(value: StateFilter): string {
    return value === "all"
      ? t("allRequests")
      : (t as unknown as (k: string) => string)(`state_${value}`);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1">
          {filters.map((value) => (
            <Button
              key={value}
              size="sm"
              shape="pill"
              variant={filter === value ? "secondary" : "ghost"}
              onClick={() => setFilter(value)}
            >
              {filterLabel(value)}
              <span className="text-xs text-muted-foreground tabular-nums">({counts[value]})</span>
            </Button>
          ))}
        </div>
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="w-full sm:w-64"
          aria-label={t("title")}
        />
      </div>

      {listQuery.isLoading ? (
        <ul className="grid gap-3 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <li key={i}>
              <Skeleton className="h-28 w-full rounded-lg" />
            </li>
          ))}
        </ul>
      ) : listQuery.isError ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-8 text-center">
          <p className="text-sm text-destructive">{listQuery.error.message}</p>
          <Button size="sm" variant="outline" onClick={() => void listQuery.refetch()}>
            {tCommon("retry")}
          </Button>
        </div>
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center gap-1 rounded-lg border border-dashed p-10 text-center">
          <p className="font-medium">{t("emptyTitle")}</p>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {visible.map((request) => (
            <ApprovalRequestCard
              key={request.id}
              orgId={orgId}
              request={request}
              onChanged={() => void listQuery.refetch()}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function ApprovalRequestCard({
  orgId,
  request,
  onChanged,
}: {
  orgId: string;
  request: ApprovalRequest;
  onChanged: () => void;
}) {
  const t = useTranslations("ApprovalRequests");
  const tCommon = useTranslations("Common");
  const [expanded, setExpanded] = useState(false);
  const [decision, setDecision] = useState<PendingDecision | null>(null);
  const [comment, setComment] = useState("");

  const detailQuery = useOrgQuery<{ approvalRequest: ApprovalRequest }>(
    "approvalRequest",
    request.id,
    (organizationId) => getSwantaraService().approvalRequests.get(organizationId, request.id),
    { enabled: expanded },
  );

  const detail = detailQuery.data?.approvalRequest ?? request;
  const steps = useMemo(
    () => [...(detail.steps ?? [])].sort((a, b) => a.sequence - b.sequence),
    [detail.steps],
  );

  const decideMutation = useMutation({
    mutationFn: () =>
      getSwantaraService().approvalRequests.decide(Number(orgId), request.id, {
        stepId: decision?.step.id ?? 0,
        approve: decision?.approve ?? true,
        comment,
      }),
    onSuccess: () => {
      toast.success(decision?.approve ? t("approved") : t("refused"));
      setDecision(null);
      setComment("");
      void detailQuery.refetch();
      onChanged();
    },
    onError: () => toast.error(t("saveFailed")),
  });

  return (
    <li
      className={`flex flex-col gap-3 rounded-lg border border-l-4 bg-card p-4 shadow-sm ${
        stateStripe[request.state] ?? ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="font-medium">{humanizeKey(request.ownerType)}</span>
          <span className="text-xs text-muted-foreground">
            #{request.ownerId} · {t("colRequestedBy")} #{request.requestedBy} ·{" "}
            {formatDate(request.createdAt)}
          </span>
        </div>
        <Badge variant="outline" className={stateBadge[request.state] ?? ""}>
          {(t as unknown as (k: string) => string)(`state_${request.state}`)}
        </Badge>
      </div>

      <Button
        size="sm"
        variant="ghost"
        className="h-auto self-start p-0 text-sm text-muted-foreground hover:underline"
        onClick={() => setExpanded((v) => !v)}
      >
        {t("approvalSteps")}
      </Button>

      {expanded ? (
        detailQuery.isLoading ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : steps.length === 0 ? (
          <p className="text-xs text-muted-foreground">{t("noSteps")}</p>
        ) : (
          <ol className="flex flex-col gap-2">
            {steps.map((step) => (
              <li
                key={step.id}
                className="flex items-center justify-between gap-2 rounded-md border px-3 py-2"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm">
                    {t("step")} {step.sequence}
                  </span>
                  {step.decidedAt ? (
                    <span className="text-xs text-muted-foreground">
                      {formatDate(step.decidedAt)}
                    </span>
                  ) : null}
                  {step.comment ? (
                    <span className="text-xs text-muted-foreground italic">{step.comment}</span>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={decisionBadge[step.decision] ?? ""}>
                    {(t as unknown as (k: string) => string)(`decision_${step.decision}`)}
                  </Badge>
                  {step.decision === "pending" ? (
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setDecision({ step, approve: true });
                          setComment("");
                        }}
                      >
                        {t("approve")}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline-destructive"
                        onClick={() => {
                          setDecision({ step, approve: false });
                          setComment("");
                        }}
                      >
                        {t("refuse")}
                      </Button>
                    </div>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        )
      ) : null}

      <Dialog open={decision != null} onOpenChange={(open) => !open && setDecision(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{decision?.approve ? t("approveStep") : t("refuseStep")}</DialogTitle>
            <DialogDescription>{t("decisionDescription")}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-1">
            <span className="text-sm">{t("comment")}</span>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              placeholder={t("commentPlaceholder")}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDecision(null)}>
              {tCommon("cancel")}
            </Button>
            <Button
              variant={decision?.approve ? "default" : "destructive"}
              disabled={decideMutation.isPending}
              onClick={() => decideMutation.mutate()}
            >
              {decision?.approve ? t("approve") : t("refuse")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </li>
  );
}
