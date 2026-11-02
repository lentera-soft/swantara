"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Archive,
  ArrowRight,
  Check,
  InboxIcon,
  Mail,
  MessageSquare,
  RefreshCw,
  UserRoundPlus,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/badge";
import { Button } from "@/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/dialog";
import { EmptyState } from "@/components/empty-state";
import { Input } from "@/components/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/tabs";
import { useOrgListQuery } from "@/lib/hooks/use-org-query";
import { usePermissions } from "@/lib/hooks/use-permissions";
import type { ContactInquiry, ListQuery, Message } from "@/lib/services/swantara";
import { getSwantaraService } from "@/lib/services/swantara";
import { formatDateTime } from "@/lib/utils";
import {
  buildInboxItems,
  filterInboxItems,
  type InboxItem,
  type InboxTab,
  inboxStatusTone,
} from "./inbox-utils";

const toneClass = {
  success: "border-success text-success",
  info: "border-info text-info",
  warning: "border-warning text-warning",
  neutral: "",
} as const;

const queryParams: ListQuery = { size: 50, sort: "created_at:desc" };

export function InboxSection({ orgId }: { orgId: string }) {
  const t = useTranslations("Inbox");
  const tCommon = useTranslations("Common");
  const queryClient = useQueryClient();
  const permissions = usePermissions();
  const [tab, setTab] = useState<InboxTab>("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<InboxItem | null>(null);

  const canViewInquiries = !permissions.isLoading && permissions.has("prospect.view");
  const canViewMessages = !permissions.isLoading && permissions.has("message.view");

  const inquiriesQuery = useOrgListQuery<{ inquiries: ContactInquiry[] }, ListQuery>(
    "inboxInquiries",
    (organizationId, params) => getSwantaraService().crmInquiries.list(organizationId, params),
    queryParams,
    { enabled: canViewInquiries },
  );

  const messagesQuery = useOrgListQuery<{ messages: Message[] }, ListQuery>(
    "inboxMessages",
    (organizationId, params) => getSwantaraService().messages.list(organizationId, params),
    queryParams,
    { enabled: canViewMessages },
  );

  const inquiries = inquiriesQuery.data?.inquiries ?? [];
  const messages = messagesQuery.data?.messages ?? [];
  const items = buildInboxItems(inquiries, messages);
  const visible = filterInboxItems(items, tab, query);

  const isLoading = inquiriesQuery.isLoading || messagesQuery.isLoading;
  const isFetching = inquiriesQuery.isFetching || messagesQuery.isFetching;
  const isError = inquiriesQuery.isError && messagesQuery.isError;

  function refresh() {
    if (canViewInquiries) void inquiriesQuery.refetch();
    if (canViewMessages) void messagesQuery.refetch();
  }

  function refreshInquiries() {
    void queryClient.invalidateQueries({ queryKey: ["inboxInquiries"] });
    void queryClient.invalidateQueries({ queryKey: ["crmInquiries"] });
  }

  const statusMutation = useMutation({
    mutationFn: ({ id, next }: { id: number; next: "reviewed" | "archived" }) =>
      getSwantaraService().crmInquiries.updateStatus(Number(orgId), id, {
        status: next,
      }),
    onSuccess: () => {
      toast.success(t("updated"));
      setSelected(null);
      refreshInquiries();
    },
    onError: () => toast.error(t("saveFailed")),
  });

  const convertMutation = useMutation({
    mutationFn: ({ id, allowDuplicate }: { id: number; allowDuplicate: boolean }) =>
      getSwantaraService().crmInquiries.convert(Number(orgId), id, {
        allowDuplicate,
      }),
    onSuccess: () => {
      toast.success(t("converted"));
      setSelected(null);
      refreshInquiries();
    },
    onError: (error, variables) => {
      const message = error instanceof Error ? error.message : "";
      if (!variables.allowDuplicate && message.toLowerCase().includes("already exists")) {
        if (window.confirm(t("duplicateDescription"))) {
          convertMutation.mutate({ id: variables.id, allowDuplicate: true });
        }
        return;
      }
      toast.error(message || t("saveFailed"));
    },
  });

  const noAccess = !permissions.isLoading && !canViewInquiries && !canViewMessages;

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <Card>
        <CardHeader className="border-b">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <CardTitle>{t("title")}</CardTitle>
              <CardDescription>{t("listDescription")}</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t("searchPlaceholder")}
                aria-label={t("searchPlaceholder")}
                className="w-full sm:w-64"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={refresh}
                disabled={isFetching || noAccess}
              >
                <RefreshCw className={isFetching ? "animate-spin" : undefined} />
                {isFetching ? t("refreshing") : t("refresh")}
              </Button>
            </div>
          </div>
          <Tabs value={tab} onValueChange={(value) => setTab(value as InboxTab)}>
            <TabsList variant="line" className="mt-2">
              <TabsTrigger value="all">{t("tabAll")}</TabsTrigger>
              <TabsTrigger value="inquiry">{t("tabInquiries")}</TabsTrigger>
              <TabsTrigger value="message">{t("tabMessages")}</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="p-0">
          {noAccess ? (
            <EmptyState
              title={t("permissionTitle")}
              description={t("permissionHint")}
              icon={InboxIcon}
            />
          ) : isLoading ? (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">
              {tCommon("loading")}
            </p>
          ) : isError ? (
            <EmptyState
              title={t("loadFailed")}
              description={t("loadFailedDescription")}
              icon={InboxIcon}
            >
              <Button variant="outline" size="sm" onClick={refresh}>
                {tCommon("retry")}
              </Button>
            </EmptyState>
          ) : visible.length === 0 ? (
            <EmptyState
              title={items.length === 0 ? t("emptyTitle") : t("emptyFilteredTitle")}
              description={
                items.length === 0 ? t("emptyDescription") : t("emptyFilteredDescription")
              }
              icon={InboxIcon}
            >
              {items.length === 0 ? (
                <Button variant="outline" size="sm" asChild>
                  <Link href="/crm/inquiries">
                    {t("viewAllInCrm")}
                    <ArrowRight />
                  </Link>
                </Button>
              ) : null}
            </EmptyState>
          ) : (
            <ul className="divide-y">
              {visible.map((item) => {
                const tone = inboxStatusTone(item.kind, item.status);
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => setSelected(item)}
                      className="flex w-full flex-col gap-2 px-4 py-3 text-left transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none sm:flex-row sm:items-start sm:justify-between"
                    >
                      <div className="flex min-w-0 items-start gap-3">
                        <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                          {item.kind === "inquiry" ? (
                            <Mail className="size-4" aria-hidden />
                          ) : (
                            <MessageSquare className="size-4" aria-hidden />
                          )}
                        </span>
                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium">{item.title}</span>
                            <Badge variant="outline">
                              {item.kind === "inquiry" ? t("kindInquiry") : t("kindMessage")}
                            </Badge>
                            <Badge variant="outline" className={toneClass[tone]}>
                              {t(item.statusKey)}
                            </Badge>
                          </div>
                          <p className="line-clamp-2 text-sm text-muted-foreground">
                            {item.preview}
                          </p>
                          {item.meta ? (
                            <p className="truncate text-xs text-muted-foreground">{item.meta}</p>
                          ) : null}
                        </div>
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground sm:pt-1">
                        {formatDateTime(item.createdAt)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <InboxDetailDialog
        item={selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
        onMarkReviewed={(id) => statusMutation.mutate({ id, next: "reviewed" })}
        onArchive={(id) => statusMutation.mutate({ id, next: "archived" })}
        onConvert={(id) => convertMutation.mutate({ id, allowDuplicate: false })}
        isPending={statusMutation.isPending || convertMutation.isPending}
      />
    </div>
  );
}

function InboxDetailDialog({
  item,
  onOpenChange,
  onMarkReviewed,
  onArchive,
  onConvert,
  isPending,
}: {
  item: InboxItem | null;
  onOpenChange: (open: boolean) => void;
  onMarkReviewed: (id: number) => void;
  onArchive: (id: number) => void;
  onConvert: (id: number) => void;
  isPending: boolean;
}) {
  const t = useTranslations("Inbox");
  const tCommon = useTranslations("Common");

  if (!item) return null;

  const inquiry = item.inquiry;
  const message = item.message;

  return (
    <Dialog open={Boolean(item)} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{item.title}</DialogTitle>
          <DialogDescription>
            {item.kind === "inquiry" ? t("kindInquiry") : t("kindMessage")} ·{" "}
            {formatDateTime(item.createdAt)}
          </DialogDescription>
        </DialogHeader>

        {inquiry ? (
          <div className="flex flex-col gap-4">
            <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">{t("from")}</dt>
                <dd>{inquiry.name}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t("email")}</dt>
                <dd className="truncate">{inquiry.email}</dd>
              </div>
              {inquiry.company ? (
                <div>
                  <dt className="text-muted-foreground">{t("company")}</dt>
                  <dd>{inquiry.company}</dd>
                </div>
              ) : null}
              {inquiry.source ? (
                <div>
                  <dt className="text-muted-foreground">{t("source")}</dt>
                  <dd>{inquiry.source}</dd>
                </div>
              ) : null}
              <div>
                <dt className="text-muted-foreground">{t("statusLabel")}</dt>
                <dd>
                  <Badge
                    variant="outline"
                    className={toneClass[inboxStatusTone("inquiry", inquiry.status)]}
                  >
                    {t(`status_${inquiry.status}`)}
                  </Badge>
                </dd>
              </div>
            </dl>
            <div className="rounded-lg border bg-muted/30 p-3 text-sm whitespace-pre-wrap">
              {inquiry.message}
            </div>
          </div>
        ) : null}

        {message ? (
          <div className="flex flex-col gap-4">
            <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">{t("record")}</dt>
                <dd>
                  {message.ownerType} #{message.ownerId}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t("author")}</dt>
                <dd>#{message.authorId}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t("messageType")}</dt>
                <dd>
                  <Badge
                    variant="outline"
                    className={toneClass[inboxStatusTone("message", message.messageType)]}
                  >
                    {t(`messageType_${message.messageType}`)}
                  </Badge>
                </dd>
              </div>
            </dl>
            <div className="rounded-lg border bg-muted/30 p-3 text-sm whitespace-pre-wrap">
              {message.body}
            </div>
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {tCommon("close")}
          </Button>
          {inquiry ? (
            <>
              {inquiry.status === "new" ? (
                <Button
                  variant="outline"
                  onClick={() => onMarkReviewed(inquiry.id)}
                  disabled={isPending}
                >
                  <Check />
                  {t("markReviewed")}
                </Button>
              ) : null}
              {inquiry.status !== "archived" ? (
                <Button variant="ghost" onClick={() => onArchive(inquiry.id)} disabled={isPending}>
                  <Archive />
                  {t("archive")}
                </Button>
              ) : null}
              {inquiry.status !== "archived" && inquiry.prospectId == null ? (
                <Button onClick={() => onConvert(inquiry.id)} disabled={isPending}>
                  <UserRoundPlus />
                  {t("convert")}
                </Button>
              ) : null}
              <Button variant="outline" asChild>
                <Link href="/crm/inquiries">{t("viewAllInCrm")}</Link>
              </Button>
            </>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
