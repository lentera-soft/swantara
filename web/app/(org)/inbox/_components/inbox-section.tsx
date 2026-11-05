"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Archive,
  ArrowLeft,
  Check,
  InboxIcon,
  Mail,
  MessageSquare,
  RefreshCw,
  UserRoundPlus,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [duplicateConfirmId, setDuplicateConfirmId] = useState<number | null>(null);

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
  const items = useMemo(() => buildInboxItems(inquiries, messages), [inquiries, messages]);

  const visible = useMemo(() => filterInboxItems(items, tab, query), [items, tab, query]);

  const selected = useMemo(
    () => items.find((item) => item.id === selectedId) ?? null,
    [items, selectedId],
  );

  const isLoading = inquiriesQuery.isLoading || messagesQuery.isLoading;
  const isFetching = inquiriesQuery.isFetching || messagesQuery.isFetching;
  const isError = inquiriesQuery.isError && messagesQuery.isError;
  const noAccess = !permissions.isLoading && !canViewInquiries && !canViewMessages;

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
      setSelectedId(null);
      refreshInquiries();
    },
    onError: (error, variables) => {
      const message = error instanceof Error ? error.message : "";
      if (!variables.allowDuplicate && message.toLowerCase().includes("already exists")) {
        setDuplicateConfirmId(variables.id);
        return;
      }
      toast.error(message || t("saveFailed"));
    },
  });

  const tabs: { value: InboxTab; label: string }[] = [
    { value: "all", label: t("tabAll") },
    { value: "inquiry", label: t("tabInquiries") },
    { value: "message", label: t("tabMessages") },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="grid min-h-[28rem] gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <section
          aria-label={t("title")}
          className={`flex-col rounded-xl border bg-card ${selected ? "hidden lg:flex" : "flex"}`}
        >
          <div className="flex flex-col gap-3 border-b p-3">
            <div className="flex items-center gap-2">
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t("searchPlaceholder")}
                aria-label={t("searchPlaceholder")}
                className="min-w-0 flex-1"
              />
              <Button
                size="icon"
                variant="ghost"
                onClick={refresh}
                disabled={isFetching || noAccess}
                aria-label={t("refresh")}
              >
                <RefreshCw className={isFetching ? "animate-spin" : undefined} />
              </Button>
            </div>
            <div className="flex gap-1">
              {tabs.map((entry) => (
                <Button
                  key={entry.value}
                  size="sm"
                  shape="pill"
                  variant={tab === entry.value ? "secondary" : "ghost"}
                  onClick={() => setTab(entry.value)}
                >
                  {entry.label}
                </Button>
              ))}
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {noAccess ? (
              <PaneNotice title={t("permissionTitle")} description={t("permissionHint")} />
            ) : isLoading ? (
              <ul className="flex flex-col gap-2 p-3">
                {[0, 1, 2, 3, 4].map((i) => (
                  <li key={i}>
                    <Skeleton className="h-14 w-full rounded-lg" />
                  </li>
                ))}
              </ul>
            ) : isError ? (
              <PaneNotice title={t("loadFailed")} description={t("loadFailedDescription")}>
                <Button size="sm" variant="outline" onClick={refresh}>
                  {tCommon("retry")}
                </Button>
              </PaneNotice>
            ) : visible.length === 0 ? (
              <PaneNotice
                title={items.length === 0 ? t("emptyTitle") : t("emptyFilteredTitle")}
                description={
                  items.length === 0 ? t("emptyDescription") : t("emptyFilteredDescription")
                }
              />
            ) : (
              <ul className="divide-y">
                {visible.map((item) => {
                  const isCurrent = item.id === selectedId;
                  const isNew = item.kind === "inquiry" && item.status === "new";
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(item.id)}
                        aria-current={isCurrent}
                        className={`flex w-full items-start gap-3 px-3 py-3 text-left transition-colors hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none ${
                          isCurrent ? "bg-muted/70" : ""
                        }`}
                      >
                        <span
                          className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-full ${
                            item.kind === "inquiry"
                              ? "bg-primary/10 text-primary"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {item.kind === "inquiry" ? (
                            <Mail className="size-4" aria-hidden />
                          ) : (
                            <MessageSquare className="size-4" aria-hidden />
                          )}
                        </span>
                        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                          <span className="flex items-center justify-between gap-2">
                            <span
                              className={`min-w-0 truncate ${isNew ? "font-semibold" : "font-medium"}`}
                            >
                              {item.title}
                            </span>
                            <span className="shrink-0 text-[0.7rem] text-muted-foreground tabular-nums">
                              {formatDateTime(item.createdAt)}
                            </span>
                          </span>
                          <span className="line-clamp-1 text-sm text-muted-foreground">
                            {item.preview}
                          </span>
                          <span className="flex items-center gap-1.5">
                            {isNew ? (
                              <span aria-hidden className="size-1.5 rounded-full bg-warning" />
                            ) : null}
                            <Badge
                              variant="outline"
                              className={`text-[0.7rem] ${toneClass[inboxStatusTone(item.kind, item.status)]}`}
                            >
                              {t(item.statusKey)}
                            </Badge>
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>

        <section
          aria-label={t("description")}
          className={`min-w-0 flex-col rounded-xl border bg-card ${
            selected ? "flex" : "hidden lg:flex"
          }`}
        >
          {selected ? (
            <InboxReadingPane
              item={selected}
              onBack={() => setSelectedId(null)}
              isPending={statusMutation.isPending || convertMutation.isPending}
              onMarkReviewed={(id) => statusMutation.mutate({ id, next: "reviewed" })}
              onArchive={(id) => statusMutation.mutate({ id, next: "archived" })}
              onConvert={(id) => convertMutation.mutate({ id, allowDuplicate: false })}
            />
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
              <span className="grid size-12 place-items-center rounded-full bg-muted">
                <InboxIcon className="size-5 text-muted-foreground" aria-hidden />
              </span>
              <p className="font-medium">{t("emptyTitle")}</p>
              <p className="max-w-xs text-sm text-muted-foreground">{t("emptyDescription")}</p>
            </div>
          )}
        </section>
      </div>

      <Dialog
        open={duplicateConfirmId != null}
        onOpenChange={(open) => !open && setDuplicateConfirmId(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("convert")}</DialogTitle>
            <DialogDescription>{t("duplicateDescription")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDuplicateConfirmId(null)}>
              {tCommon("cancel")}
            </Button>
            <Button
              disabled={convertMutation.isPending}
              onClick={() => {
                if (duplicateConfirmId != null) {
                  convertMutation.mutate({ id: duplicateConfirmId, allowDuplicate: true });
                }
                setDuplicateConfirmId(null);
              }}
            >
              {t("convert")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PaneNotice({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-muted">
        <InboxIcon className="size-5 text-muted-foreground" aria-hidden />
      </span>
      <p className="font-medium">{title}</p>
      <p className="max-w-xs text-sm text-muted-foreground">{description}</p>
      {children}
    </div>
  );
}

function InboxReadingPane({
  item,
  onBack,
  isPending,
  onMarkReviewed,
  onArchive,
  onConvert,
}: {
  item: InboxItem;
  onBack: () => void;
  isPending: boolean;
  onMarkReviewed: (id: number) => void;
  onArchive: (id: number) => void;
  onConvert: (id: number) => void;
}) {
  const t = useTranslations("Inbox");
  const tCommon = useTranslations("Common");

  const inquiry = item.inquiry;
  const message = item.message;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-col gap-2 border-b p-4">
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" className="-ml-2 lg:hidden" onClick={onBack}>
            <ArrowLeft />
            {tCommon("back")}
          </Button>
          <Badge variant="outline" className="ml-auto lg:ml-0">
            {item.kind === "inquiry" ? t("kindInquiry") : t("kindMessage")}
          </Badge>
          <Badge variant="outline" className={toneClass[inboxStatusTone(item.kind, item.status)]}>
            {t(item.statusKey)}
          </Badge>
        </div>
        <h2 className="text-lg font-semibold tracking-tight">{item.title}</h2>
        <p className="text-xs text-muted-foreground">
          {item.meta} · {formatDateTime(item.createdAt)}
        </p>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
        {inquiry ? (
          <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs text-muted-foreground">{t("from")}</dt>
              <dd>{inquiry.name}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">{t("email")}</dt>
              <dd className="truncate">{inquiry.email}</dd>
            </div>
            {inquiry.company ? (
              <div>
                <dt className="text-xs text-muted-foreground">{t("company")}</dt>
                <dd>{inquiry.company}</dd>
              </div>
            ) : null}
            {inquiry.source ? (
              <div>
                <dt className="text-xs text-muted-foreground">{t("source")}</dt>
                <dd>{inquiry.source}</dd>
              </div>
            ) : null}
          </dl>
        ) : null}

        {message ? (
          <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs text-muted-foreground">{t("record")}</dt>
              <dd>
                {message.ownerType} #{message.ownerId}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">{t("author")}</dt>
              <dd>#{message.authorId}</dd>
            </div>
          </dl>
        ) : null}

        <div className="rounded-lg border bg-muted/30 p-4 text-sm leading-relaxed whitespace-pre-wrap">
          {item.preview}
        </div>
      </div>

      {inquiry ? (
        <div className="flex flex-wrap items-center gap-2 border-t p-3">
          {inquiry.status === "new" ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onMarkReviewed(inquiry.id)}
              disabled={isPending}
            >
              <Check />
              {t("markReviewed")}
            </Button>
          ) : null}
          {inquiry.status !== "archived" ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onArchive(inquiry.id)}
              disabled={isPending}
            >
              <Archive />
              {t("archive")}
            </Button>
          ) : null}
          {inquiry.status !== "archived" && inquiry.prospectId == null ? (
            <Button size="sm" onClick={() => onConvert(inquiry.id)} disabled={isPending}>
              <UserRoundPlus />
              {t("convert")}
            </Button>
          ) : null}
          <Button size="sm" variant="link" className="ml-auto" asChild>
            <Link href="/crm/inquiries">{t("viewAllInCrm")}</Link>
          </Button>
        </div>
      ) : null}
    </div>
  );
}
