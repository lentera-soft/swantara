"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  Clock,
  Eye,
  Pencil,
  Plug,
  Plus,
  RefreshCw,
  Send,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/badge";
import { Button } from "@/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/card";
import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/dialog";
import { EmptyState } from "@/components/empty-state";
import { Input } from "@/components/input";
import { MetricGrid } from "@/components/metric-grid";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/select";
import { StatCard } from "@/components/stat-card";
import { Switch } from "@/components/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/tabs";
import { useOrgListQuery } from "@/lib/hooks/use-org-query";
import { usePermissions } from "@/lib/hooks/use-permissions";
import type {
  IntegrationEvent,
  ListQuery,
  WebhookDelivery,
  WebhookSubscription,
} from "@/lib/services/swantara";
import { getSwantaraService } from "@/lib/services/swantara";
import { formatDateTime } from "@/lib/utils";
import { logger } from "@/lib/utils/client-logger";
import {
  type DeliveryStatusFilter,
  deliveryStatusTone,
  type EventStatusFilter,
  eventStatusTone,
  filterDeliveries,
  filterEvents,
  filterWebhooks,
  formatPayload,
  type IntegrationTab,
} from "./integration-utils";
import { WebhookFormDialog } from "./webhook-form-dialog";

const toneClass = {
  success: "border-success text-success",
  warning: "border-warning text-warning",
  info: "border-info text-info",
  neutral: "",
} as const;

const webhookParams: ListQuery = { size: 100, sort: "created_at:desc" };
const eventParams: ListQuery = { size: 100, sort: "created_at:desc" };
const deliveryParams: ListQuery = { size: 100, sort: "created_at:desc" };

export function IntegrationSection({ orgId }: { orgId: string }) {
  const t = useTranslations("Integration");
  const tCommon = useTranslations("Common");
  const queryClient = useQueryClient();
  const permissions = usePermissions();
  const [tab, setTab] = useState<IntegrationTab>("webhooks");
  const [webhookSearch, setWebhookSearch] = useState("");
  const [eventSearch, setEventSearch] = useState("");
  const [deliverySearch, setDeliverySearch] = useState("");
  const [eventStatus, setEventStatus] = useState<EventStatusFilter>("all");
  const [deliveryStatus, setDeliveryStatus] = useState<DeliveryStatusFilter>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<WebhookSubscription | null>(null);
  const [payloadEvent, setPayloadEvent] = useState<IntegrationEvent | null>(null);

  const canViewWebhooks = !permissions.isLoading && permissions.has("webhook_subscription.view");
  const canViewEvents = !permissions.isLoading && permissions.has("integration-event.view");
  const canViewDeliveries = !permissions.isLoading && permissions.has("webhook_delivery.view");

  const webhooksQuery = useOrgListQuery<{ webhookSubscriptions: WebhookSubscription[] }, ListQuery>(
    "webhookSubscriptions",
    (organizationId, params) =>
      getSwantaraService().webhookSubscriptions.list(organizationId, params),
    webhookParams,
    { enabled: canViewWebhooks },
  );

  const eventsQuery = useOrgListQuery<{ integrationEvents: IntegrationEvent[] }, ListQuery>(
    "integrationEvents",
    (organizationId, params) => getSwantaraService().integrationEvents.list(organizationId, params),
    eventParams,
    { enabled: canViewEvents },
  );

  const deliveriesQuery = useOrgListQuery<{ webhookDeliveries: WebhookDelivery[] }, ListQuery>(
    "webhookDeliveries",
    (organizationId, params) => getSwantaraService().webhookDeliveries.list(organizationId, params),
    deliveryParams,
    { enabled: canViewDeliveries },
  );

  const webhooks = webhooksQuery.data?.webhookSubscriptions ?? [];
  const events = eventsQuery.data?.integrationEvents ?? [];
  const deliveries = deliveriesQuery.data?.webhookDeliveries ?? [];

  const visibleWebhooks = filterWebhooks(webhooks, webhookSearch);
  const visibleEvents = filterEvents(events, eventStatus, eventSearch);
  const visibleDeliveries = filterDeliveries(deliveries, deliveryStatus, deliverySearch);

  const activeWebhooks = webhooks.filter((webhook) => webhook.enabled).length;
  const pendingEvents = events.filter((event) => event.status === "pending").length;
  const failedDeliveries = deliveries.filter((delivery) => delivery.status === "failed").length;

  const isFetching =
    webhooksQuery.isFetching || eventsQuery.isFetching || deliveriesQuery.isFetching;
  const noAccess =
    !permissions.isLoading && !canViewWebhooks && !canViewEvents && !canViewDeliveries;

  function refresh() {
    void queryClient.invalidateQueries({ queryKey: ["webhookSubscriptions"] });
    void queryClient.invalidateQueries({ queryKey: ["integrationEvents"] });
    void queryClient.invalidateQueries({ queryKey: ["webhookDeliveries"] });
  }

  const toggleMutation = useMutation({
    mutationFn: ({ webhook, enabled }: { webhook: WebhookSubscription; enabled: boolean }) =>
      getSwantaraService().webhookSubscriptions.update(Number(orgId), webhook.id, {
        url: webhook.url,
        enabled,
      }),
    onSuccess: () => {
      toast.success(t("webhookUpdated"));
      refresh();
    },
    onError: (error) => {
      logger.error("Failed to toggle webhook", error);
      toast.error(t("saveFailed"));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => getSwantaraService().webhookSubscriptions.delete(Number(orgId), id),
    onSuccess: () => {
      toast.success(t("webhookDeleted"));
      refresh();
    },
    onError: (error) => {
      logger.error("Failed to delete webhook", error);
      toast.error(t("deleteFailed"));
    },
  });

  const dispatchMutation = useMutation({
    mutationFn: (id: number) => getSwantaraService().integrationEvents.dispatch(Number(orgId), id),
    onSuccess: () => {
      toast.success(t("eventDispatched"));
      refresh();
    },
    onError: (error) => {
      logger.error("Failed to dispatch event", error);
      toast.error(t("dispatchFailed"));
    },
  });

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(webhook: WebhookSubscription) {
    setEditing(webhook);
    setFormOpen(true);
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button variant="outline" size="sm" onClick={refresh} disabled={isFetching || noAccess}>
          <RefreshCw className={isFetching ? "animate-spin" : undefined} />
          {isFetching ? t("refreshing") : t("refresh")}
        </Button>
        <Button size="sm" onClick={openCreate} disabled={!canViewWebhooks}>
          <Plus />
          {t("addWebhook")}
        </Button>
      </div>

      <MetricGrid>
        <StatCard label={t("statActiveWebhooks")} value={String(activeWebhooks)} icon={Plug} />
        <StatCard label={t("statEvents")} value={String(events.length)} icon={Activity} />
        <StatCard label={t("statPendingEvents")} value={String(pendingEvents)} icon={Clock} />
        <StatCard
          label={t("statFailedDeliveries")}
          value={String(failedDeliveries)}
          icon={TriangleAlert}
        />
      </MetricGrid>

      {noAccess ? (
        <Card>
          <CardContent>
            <EmptyState
              title={t("permissionTitle")}
              description={t("permissionHint")}
              icon={Plug}
            />
          </CardContent>
        </Card>
      ) : (
        <Tabs value={tab} onValueChange={(value) => setTab(value as IntegrationTab)}>
          <TabsList variant="line">
            <TabsTrigger value="webhooks">{t("tabWebhooks")}</TabsTrigger>
            <TabsTrigger value="events">{t("tabEvents")}</TabsTrigger>
            <TabsTrigger value="deliveries">{t("tabDeliveries")}</TabsTrigger>
          </TabsList>

          <TabsContent value="webhooks" className="pt-4">
            <Card>
              <CardHeader className="flex-row items-start justify-between gap-4">
                <div className="space-y-1">
                  <CardTitle>{t("webhooksTitle")}</CardTitle>
                  <CardDescription>{t("webhooksDescription")}</CardDescription>
                </div>
                <Input
                  value={webhookSearch}
                  onChange={(event) => setWebhookSearch(event.target.value)}
                  placeholder={t("searchWebhooksPlaceholder")}
                  aria-label={t("searchWebhooksPlaceholder")}
                  className="max-w-64"
                />
              </CardHeader>
              <CardContent>
                {webhooksQuery.isLoading ? (
                  <p className="text-sm text-muted-foreground">{tCommon("loading")}</p>
                ) : visibleWebhooks.length === 0 ? (
                  <EmptyState
                    title={t("webhooksEmpty")}
                    description={t("webhooksEmptyDescription")}
                    icon={Plug}
                  >
                    <Button variant="outline" size="sm" onClick={openCreate}>
                      <Plus />
                      {t("addWebhook")}
                    </Button>
                  </EmptyState>
                ) : (
                  <Table aria-label={t("webhooksTitle")}>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("colUrl")}</TableHead>
                        <TableHead>{t("colEnabled")}</TableHead>
                        <TableHead>{t("colCreated")}</TableHead>
                        <TableHead className="text-right">{t("colActions")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {visibleWebhooks.map((webhook) => (
                        <TableRow key={webhook.id}>
                          <TableCell className="max-w-[28rem] whitespace-normal break-all font-mono text-xs">
                            {webhook.url}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Switch
                                size="sm"
                                checked={webhook.enabled}
                                onCheckedChange={(checked) =>
                                  toggleMutation.mutate({
                                    webhook,
                                    enabled: Boolean(checked),
                                  })
                                }
                                disabled={toggleMutation.isPending}
                                aria-label={t("colEnabled")}
                              />
                              <span className="text-xs text-muted-foreground">
                                {webhook.enabled ? t("enabled") : t("disabled")}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDateTime(webhook.createdAt)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEdit(webhook)}
                                aria-label={t("edit")}
                              >
                                <Pencil />
                                <span className="sr-only">{t("edit")}</span>
                              </Button>
                              <ConfirmDialog
                                title={t("deleteTitle")}
                                description={t("deleteDescription")}
                                confirmLabel={t("delete")}
                                onConfirm={() => deleteMutation.mutate(webhook.id)}
                                trigger={
                                  <Button variant="ghost" size="sm" aria-label={t("delete")}>
                                    <Trash2 />
                                    <span className="sr-only">{t("delete")}</span>
                                  </Button>
                                }
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="events" className="pt-4">
            <Card>
              <CardHeader className="flex-row items-start justify-between gap-4">
                <div className="space-y-1">
                  <CardTitle>{t("eventsTitle")}</CardTitle>
                  <CardDescription>{t("eventsDescription")}</CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Select
                    value={eventStatus}
                    onValueChange={(value) => setEventStatus(value as EventStatusFilter)}
                  >
                    <SelectTrigger className="w-36" aria-label={t("colStatus")}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("filterAll")}</SelectItem>
                      <SelectItem value="pending">{t("status_pending")}</SelectItem>
                      <SelectItem value="sent">{t("status_sent")}</SelectItem>
                      <SelectItem value="failed">{t("status_failed")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    value={eventSearch}
                    onChange={(event) => setEventSearch(event.target.value)}
                    placeholder={t("searchEventsPlaceholder")}
                    aria-label={t("searchEventsPlaceholder")}
                    className="w-full sm:w-56"
                  />
                </div>
              </CardHeader>
              <CardContent>
                {eventsQuery.isLoading ? (
                  <p className="text-sm text-muted-foreground">{tCommon("loading")}</p>
                ) : visibleEvents.length === 0 ? (
                  <EmptyState
                    title={t("eventsEmpty")}
                    description={t("eventsEmptyDescription")}
                    icon={Activity}
                  />
                ) : (
                  <Table aria-label={t("eventsTitle")}>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("colTopic")}</TableHead>
                        <TableHead>{t("colStatus")}</TableHead>
                        <TableHead className="text-right">{t("colRetries")}</TableHead>
                        <TableHead>{t("colCreated")}</TableHead>
                        <TableHead className="text-right">{t("colActions")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {visibleEvents.map((event) => (
                        <TableRow key={event.id}>
                          <TableCell className="font-mono text-xs">{event.topic}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={toneClass[eventStatusTone(event.status)]}
                            >
                              {t(`status_${event.status}`)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right tabular-nums">{event.retries}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDateTime(event.createdAt)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setPayloadEvent(event)}
                                aria-label={t("viewPayload")}
                              >
                                <Eye />
                                <span className="sr-only">{t("viewPayload")}</span>
                              </Button>
                              {event.status !== "sent" ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => dispatchMutation.mutate(event.id)}
                                  disabled={dispatchMutation.isPending}
                                >
                                  <Send />
                                  {dispatchMutation.isPending ? t("dispatching") : t("dispatch")}
                                </Button>
                              ) : null}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="deliveries" className="pt-4">
            <Card>
              <CardHeader className="flex-row items-start justify-between gap-4">
                <div className="space-y-1">
                  <CardTitle>{t("deliveriesTitle")}</CardTitle>
                  <CardDescription>{t("deliveriesDescription")}</CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Select
                    value={deliveryStatus}
                    onValueChange={(value) => setDeliveryStatus(value as DeliveryStatusFilter)}
                  >
                    <SelectTrigger className="w-36" aria-label={t("colStatus")}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("filterAll")}</SelectItem>
                      <SelectItem value="delivered">{t("deliveryStatus_delivered")}</SelectItem>
                      <SelectItem value="failed">{t("deliveryStatus_failed")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    value={deliverySearch}
                    onChange={(event) => setDeliverySearch(event.target.value)}
                    placeholder={t("searchDeliveriesPlaceholder")}
                    aria-label={t("searchDeliveriesPlaceholder")}
                    className="w-full sm:w-56"
                  />
                </div>
              </CardHeader>
              <CardContent>
                {deliveriesQuery.isLoading ? (
                  <p className="text-sm text-muted-foreground">{tCommon("loading")}</p>
                ) : visibleDeliveries.length === 0 ? (
                  <EmptyState
                    title={t("deliveriesEmpty")}
                    description={t("deliveriesEmptyDescription")}
                    icon={Send}
                  />
                ) : (
                  <Table aria-label={t("deliveriesTitle")}>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("colEvent")}</TableHead>
                        <TableHead>{t("colSubscription")}</TableHead>
                        <TableHead>{t("colStatus")}</TableHead>
                        <TableHead className="text-right">{t("colAttempt")}</TableHead>
                        <TableHead className="text-right">{t("colResponse")}</TableHead>
                        <TableHead>{t("colDeliveredAt")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {visibleDeliveries.map((delivery) => (
                        <TableRow key={delivery.id}>
                          <TableCell className="font-mono text-xs">#{delivery.eventId}</TableCell>
                          <TableCell className="font-mono text-xs">
                            {delivery.subscriptionId != null ? `#${delivery.subscriptionId}` : "—"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={toneClass[deliveryStatusTone(delivery.status)]}
                            >
                              {t(`deliveryStatus_${delivery.status}`)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {delivery.attempt}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {delivery.responseCode ?? "—"}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {delivery.deliveredAt ? formatDateTime(delivery.deliveredAt) : "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      <WebhookFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        orgId={orgId}
        initial={editing}
        onSaved={refresh}
      />

      <Dialog
        open={Boolean(payloadEvent)}
        onOpenChange={(open) => {
          if (!open) setPayloadEvent(null);
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("payloadTitle")}</DialogTitle>
            <DialogDescription>
              {t("payloadDescription", { topic: payloadEvent?.topic ?? "" })}
            </DialogDescription>
          </DialogHeader>
          <pre className="max-h-[60vh] overflow-auto rounded-lg border bg-muted/30 p-3 font-mono text-xs">
            {formatPayload(payloadEvent?.payload)}
          </pre>
        </DialogContent>
      </Dialog>
    </div>
  );
}
