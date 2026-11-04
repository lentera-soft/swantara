"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bike,
  Building2,
  Check,
  CreditCard,
  MessageCircle,
  Plug,
  PlugZap,
  RefreshCw,
  SearchX,
  ShoppingBag,
  Unplug,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/badge";
import { Button } from "@/components/button";
import { Card, CardContent } from "@/components/card";
import { ConfirmDialog } from "@/components/confirm-dialog";
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
import { Separator } from "@/components/separator";
import { Skeleton } from "@/components/skeleton";
import { StateBadge } from "@/components/state-badge";
import { Switch } from "@/components/switch";
import type { IntegrationCategory, IntegrationProvider } from "@/lib/services/integration-catalog";
import { filterProviders, getIntegrationCatalog } from "@/lib/services/integration-catalog";
import { formatDateTime } from "@/lib/utils";

const categoryIcons = {
  marketplace: ShoppingBag,
  delivery: Bike,
  payment: CreditCard,
  communication: MessageCircle,
  business: Building2,
} as const;

const statusTones = {
  connected: "success",
  not_connected: "neutral",
  error: "danger",
} as const;

const CATEGORIES: (IntegrationCategory | "all")[] = [
  "all",
  "marketplace",
  "delivery",
  "payment",
  "communication",
  "business",
];

const SKELETON_SLOTS = ["a", "b", "c", "d", "e", "f"];

export function AppsSection() {
  const t = useTranslations("Integration");
  const queryClient = useQueryClient();
  const [category, setCategory] = useState<IntegrationCategory | "all">("all");
  const [search, setSearch] = useState("");
  const [connecting, setConnecting] = useState<IntegrationProvider | null>(null);

  const providersQuery = useQuery({
    queryKey: ["integrationCatalog"],
    queryFn: () => getIntegrationCatalog().list(),
  });

  const providers = providersQuery.data ?? [];
  const visible = useMemo(
    () => filterProviders(providers, category, search),
    [providers, category, search],
  );

  const connectedCount = providers.filter((provider) => provider.status === "connected").length;

  function invalidate() {
    void queryClient.invalidateQueries({ queryKey: ["integrationCatalog"] });
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {t("connectedCount", { count: connectedCount })}
        </p>
        <div className="flex items-center gap-2">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("searchAppsPlaceholder")}
            aria-label={t("searchAppsPlaceholder")}
            className="w-56"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => providersQuery.refetch()}
            disabled={providersQuery.isFetching}
          >
            <RefreshCw className={providersQuery.isFetching ? "animate-spin" : undefined} />
            {providersQuery.isFetching ? t("refreshing") : t("refresh")}
          </Button>
        </div>
      </div>

      <div id="integration-apps" className="flex flex-wrap gap-2">
        {CATEGORIES.map((entry) => (
          <Button
            key={entry}
            size="sm"
            variant={category === entry ? "default" : "outline"}
            onClick={() => setCategory(entry)}
          >
            {t(`category_${entry}`)}
          </Button>
        ))}
      </div>

      {providersQuery.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {SKELETON_SLOTS.map((slot) => (
            <Skeleton key={slot} className="h-44 rounded-xl" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              title={t("appsEmpty")}
              description={t("appsEmptyDescription")}
              icon={SearchX}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((provider) => (
            <ProviderCard
              key={provider.id}
              provider={provider}
              onConnect={() => setConnecting(provider)}
              onDisconnected={invalidate}
              onReconnected={invalidate}
              onAutoSyncChanged={invalidate}
            />
          ))}
        </div>
      )}

      <ConnectDialog
        provider={connecting}
        onClose={() => setConnecting(null)}
        onConnected={() => {
          setConnecting(null);
          invalidate();
        }}
      />
    </div>
  );
}

function ProviderCard({
  provider,
  onConnect,
  onDisconnected,
  onReconnected,
  onAutoSyncChanged,
}: {
  provider: IntegrationProvider;
  onConnect: () => void;
  onDisconnected: () => void;
  onReconnected: () => void;
  onAutoSyncChanged: () => void;
}) {
  const t = useTranslations("Integration");
  const Icon = categoryIcons[provider.category];

  const disconnectMutation = useMutation({
    mutationFn: () => getIntegrationCatalog().disconnect(provider.id),
    onSuccess: () => {
      toast.success(t("disconnectedToast", { name: provider.name }));
      onDisconnected();
    },
  });

  const reconnectMutation = useMutation({
    mutationFn: () => getIntegrationCatalog().reconnect(provider.id),
    onSuccess: () => {
      toast.success(t("connectedToast", { name: provider.name }));
      onReconnected();
    },
  });

  const syncMutation = useMutation({
    mutationFn: (enabled: boolean) => getIntegrationCatalog().setAutoSync(provider.id, enabled),
    onSuccess: onAutoSyncChanged,
  });

  const isConnected = provider.status === "connected";

  return (
    <Card
      className={
        provider.status === "error"
          ? "border-destructive/50"
          : isConnected
            ? "border-teal-500/40 bg-teal-500/5"
            : undefined
      }
    >
      <CardContent className="flex h-full flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <span
              className="grid size-10 shrink-0 place-items-center rounded-xl text-white"
              style={{ backgroundColor: provider.accent }}
              aria-hidden
            >
              <Icon className="size-5" />
            </span>
            <div>
              <p className="font-medium">{provider.name}</p>
              <p className="text-xs text-muted-foreground">{t(`category_${provider.category}`)}</p>
            </div>
          </div>
          <StateBadge
            tone={statusTones[provider.status]}
            label={t(`status_${provider.status}`)}
            className="shrink-0"
          />
        </div>

        <p className="line-clamp-2 text-sm text-muted-foreground">{provider.description}</p>

        {isConnected || provider.status === "error" ? (
          <>
            <Separator />
            <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
              <p className="truncate font-medium text-foreground">{provider.accountLabel}</p>
              <p>
                {provider.lastSyncAt
                  ? t("lastSynced", { date: formatDateTime(provider.lastSyncAt) })
                  : t("neverSynced")}
              </p>
            </div>
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="text-muted-foreground">{t("autoSyncLabel")}</span>
              <Switch
                size="sm"
                checked={provider.autoSync}
                disabled={syncMutation.isPending}
                onCheckedChange={(checked) => syncMutation.mutate(Boolean(checked))}
                aria-label={t("autoSyncLabel")}
              />
            </div>
          </>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {provider.scopes.map((scope) => (
              <Badge key={scope} variant="outline" className="text-xs">
                {t(`scope_${scope}`)}
              </Badge>
            ))}
          </div>
        )}

        <div className="mt-auto flex items-center justify-end gap-2 pt-1">
          {provider.status === "not_connected" ? (
            <Button size="sm" onClick={onConnect}>
              <Plug />
              {t("connectButton")}
            </Button>
          ) : (
            <>
              {provider.status === "error" ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => reconnectMutation.mutate()}
                  disabled={reconnectMutation.isPending}
                >
                  <RefreshCw className={reconnectMutation.isPending ? "animate-spin" : undefined} />
                  {t("reconnectButton")}
                </Button>
              ) : null}
              <ConfirmDialog
                title={t("disconnectTitle")}
                description={t("disconnectDescription", { name: provider.name })}
                confirmLabel={t("disconnectButton")}
                onConfirm={() => disconnectMutation.mutate()}
                trigger={
                  <Button size="sm" variant="ghost" disabled={disconnectMutation.isPending}>
                    <Unplug />
                    {t("disconnectButton")}
                  </Button>
                }
              />
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ConnectDialog({
  provider,
  onClose,
  onConnected,
}: {
  provider: IntegrationProvider | null;
  onClose: () => void;
  onConnected: () => void;
}) {
  const t = useTranslations("Integration");
  const tCommon = useTranslations("Common");

  const connectMutation = useMutation({
    mutationFn: (target: IntegrationProvider) =>
      getIntegrationCatalog().connect(target.id, `${target.name} — ${t("demoAccountLabel")}`),
    onSuccess: (_result, target) => {
      toast.success(t("connectedToast", { name: target.name }));
      onConnected();
    },
  });

  return (
    <Dialog
      open={provider != null}
      onOpenChange={(open) => {
        if (!open && !connectMutation.isPending) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {provider ? t("authorizeTitle", { name: provider.name }) : t("authorizeTitleBlank")}
          </DialogTitle>
          <DialogDescription>
            {provider
              ? t("authorizeDescription", { name: provider.name })
              : t("authorizeDescriptionBlank")}
          </DialogDescription>
        </DialogHeader>

        {provider ? (
          <div className="flex flex-col gap-4">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {t("scopesLabel")}
            </p>
            <ul className="flex flex-col gap-2">
              {provider.scopes.map((scope) => (
                <li key={scope} className="flex items-center gap-2 text-sm">
                  <Check className="size-4 text-muted-foreground" />
                  {t(`scope_${scope}`)}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={connectMutation.isPending}>
            {tCommon("cancel")}
          </Button>
          <Button
            onClick={() => {
              if (provider != null) connectMutation.mutate(provider);
            }}
            disabled={provider == null || connectMutation.isPending}
          >
            <PlugZap className={connectMutation.isPending ? "animate-pulse" : undefined} />
            {connectMutation.isPending ? t("authorizingLabel") : t("authorizeButton")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
