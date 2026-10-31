"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Archive, Check, ChevronLeft, ChevronRight, UserPlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/badge";
import { Button } from "@/components/button";
import { Card, CardContent } from "@/components/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/select";
import { useOrgListQuery } from "@/lib/hooks/use-org-query";
import type { ContactInquiry } from "@/lib/services/swantara";
import { getSwantaraService } from "@/lib/services/swantara";
import { formatDate } from "@/lib/utils";

const statusOptions = ["all", "new", "reviewed", "archived"] as const;

export function InquiriesSection({ orgId }: { orgId: string }) {
  const t = useTranslations("Crm");
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<(typeof statusOptions)[number]>("new");
  const [source, setSource] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const params = {
    page,
    size: pageSize,
    ...(status === "all" ? {} : { filter: [`status:eq:${status}`] }),
    ...(source === "all"
      ? {}
      : { filter: [...(status === "all" ? [] : [`status:eq:${status}`]), `source:eq:${source}`] }),
  };

  const inquiriesQuery = useOrgListQuery<
    {
      inquiries: ContactInquiry[];
      meta?: { pagination?: { page: number; totalPages: number; total: number } };
    },
    typeof params
  >(
    "crmInquiries",
    (organizationId, queryParams) =>
      getSwantaraService().crmInquiries.list(organizationId, queryParams),
    params,
  );

  const inquiries = inquiriesQuery.data?.inquiries ?? [];
  const pagination = inquiriesQuery.data?.meta?.pagination;
  const sources = Array.from(
    new Set([
      ...inquiries
        .map((inquiry) => inquiry.source)
        .filter((value): value is string => Boolean(value)),
      ...(source !== "all" ? [source] : []),
    ]),
  ).sort();
  const visible = inquiries;
  const totalPages = pagination?.totalPages ?? 1;

  function refresh() {
    void queryClient.invalidateQueries({ queryKey: ["crmInquiries"] });
    void queryClient.invalidateQueries({ queryKey: ["crmLeads"] });
  }

  const statusMutation = useMutation({
    mutationFn: ({ id, next }: { id: number; next: "reviewed" | "archived" }) =>
      getSwantaraService().crmInquiries.updateStatus(Number(orgId), id, { status: next }),
    onSuccess: () => {
      toast.success(t("inquiryUpdated"));
      refresh();
    },
    onError: () => toast.error(t("saveFailed")),
  });

  const convertMutation = useMutation({
    mutationFn: ({ id, allowDuplicate }: { id: number; allowDuplicate: boolean }) =>
      getSwantaraService().crmInquiries.convert(Number(orgId), id, { allowDuplicate }),
    onSuccess: () => {
      toast.success(t("inquiryConverted"));
      refresh();
    },
    onError: (error, variables) => {
      const message = error instanceof Error ? error.message : "";
      if (!variables.allowDuplicate && message.toLowerCase().includes("already exists")) {
        if (window.confirm(t("inquiryDuplicateConfirm"))) {
          convertMutation.mutate({ id: variables.id, allowDuplicate: true });
        }
        return;
      }
      toast.error(message || t("saveFailed"));
    },
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={status}
            onValueChange={(value) => {
              setStatus(value as typeof status);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-44" aria-label={t("fieldStatus")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {option === "all" ? t("allInquiries") : t(`inquiryStatus.${option}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={source}
            onValueChange={(value) => {
              setSource(value ?? "all");
              setPage(1);
            }}
          >
            <SelectTrigger className="w-44" aria-label={t("fieldSource")}>
              <SelectValue placeholder={t("allSources")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allSources")}</SelectItem>
              {sources.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            aria-label={t("previousPage")}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={page <= 1 || inquiriesQuery.isFetching}
          >
            <ChevronLeft />
          </Button>
          <span className="text-xs text-muted-foreground">
            {page} / {Math.max(totalPages, 1)}
          </span>
          <Button
            variant="outline"
            size="sm"
            aria-label={t("nextPage")}
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            disabled={page >= totalPages || inquiriesQuery.isFetching}
          >
            <ChevronRight />
          </Button>
        </div>
      </div>

      {inquiriesQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">{t("loadingInquiries")}</p>
      ) : visible.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("emptyInquiries")}</p>
      ) : (
        <div className="flex flex-col gap-3">
          {visible.map((inquiry) => (
            <Card key={inquiry.id} size="sm">
              <CardContent className="flex flex-col gap-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{inquiry.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {inquiry.company ? `${inquiry.company} · ` : ""}
                      {inquiry.email}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={inquiry.status === "new" ? "default" : "secondary"}>
                      {t(`inquiryStatus.${inquiry.status}`)}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(inquiry.createdAt)}
                    </span>
                  </div>
                </div>
                <p className="whitespace-pre-wrap text-sm">{inquiry.message}</p>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    {inquiry.source ? (
                      <span className="rounded-full bg-muted px-2 py-0.5">{inquiry.source}</span>
                    ) : null}
                    {inquiry.medium ? (
                      <span className="rounded-full bg-muted px-2 py-0.5">{inquiry.medium}</span>
                    ) : null}
                    {inquiry.campaign ? (
                      <span className="rounded-full bg-muted px-2 py-0.5">{inquiry.campaign}</span>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {inquiry.status === "new" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => statusMutation.mutate({ id: inquiry.id, next: "reviewed" })}
                        disabled={statusMutation.isPending}
                      >
                        <Check />
                        {t("markReviewed")}
                      </Button>
                    ) : null}
                    {inquiry.status !== "archived" ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => statusMutation.mutate({ id: inquiry.id, next: "archived" })}
                        disabled={statusMutation.isPending}
                      >
                        <Archive />
                        {t("archiveInquiry")}
                      </Button>
                    ) : null}
                    {inquiry.prospectId == null ? (
                      <Button
                        size="sm"
                        onClick={() =>
                          convertMutation.mutate({ id: inquiry.id, allowDuplicate: false })
                        }
                        disabled={convertMutation.isPending}
                      >
                        <UserPlus />
                        {t("convertToLead")}
                      </Button>
                    ) : (
                      <Badge variant="outline">{t("convertedBadge")}</Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
