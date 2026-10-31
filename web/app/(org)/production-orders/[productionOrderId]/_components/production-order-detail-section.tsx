"use client";

import { ArrowLeft, CheckCircle2, Play, XCircle } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/badge";
import { Button } from "@/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/card";
import { Progress } from "@/components/progress";
import { useOrgQuery } from "@/lib/hooks/use-org-query";
import type { MOComponent, ProductionOrder, ShopTask } from "@/lib/services/swantara";
import { getSwantaraService } from "@/lib/services/swantara";
import { formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils/style";
import {
  canCancelMo,
  canConfirmMo,
  canPlanMo,
  canProduceMo,
  canSettleMo,
  canStartMo,
  componentConsumptionProgress,
  type MoState,
  moProgress,
  moProgressColor,
  moStateTone,
} from "../../_components/production-order-utils";
import { ConsumeDialog } from "./consume-dialog";
import { LaborDialog } from "./labor-dialog";
import { ProduceDialog } from "./produce-dialog";
import { SettleDialog } from "./settle-dialog";

export function MoDetailSection({
  orgId,
  productionOrderId,
}: {
  orgId: string;
  productionOrderId: string;
}) {
  const t = useTranslations("ProductionOrders");
  const tCommon = useTranslations("Common");
  const moState = (state: string) => (t as unknown as (k: string) => string)(`state_${state}`);
  const [consumeOpen, setConsumeOpen] = useState(false);
  const [produceOpen, setProduceOpen] = useState(false);
  const [settleOpen, setSettleOpen] = useState(false);
  const [laborTask, setLaborTask] = useState<ShopTask | null>(null);
  const [generatingTasks, setGeneratingTasks] = useState(false);

  const moQuery = useOrgQuery<{ productionOrder: ProductionOrder }>(
    "productionOrders",
    productionOrderId,
    (organizationId) =>
      getSwantaraService().productionOrders.get(organizationId, Number(productionOrderId)),
  );

  const componentsQuery = useOrgQuery<{ components: MOComponent[] }>(
    "productionOrders",
    `${productionOrderId}-components`,
    (organizationId) =>
      getSwantaraService().productionOrders.components(organizationId, Number(productionOrderId)),
  );

  const shopTasksQuery = useOrgQuery<{ shopTasks: ShopTask[] }>(
    "productionOrders",
    `${productionOrderId}-shopTasks`,
    (organizationId) =>
      getSwantaraService().productionOrders.shopTasks.list(
        organizationId,
        Number(productionOrderId),
      ),
  );

  const productionOrder = moQuery.data?.productionOrder;
  const components = componentsQuery.data?.components ?? [];
  const shopTasks = shopTasksQuery.data?.shopTasks ?? [];

  const state = (productionOrder?.state ?? "draft") as MoState;
  const progress = productionOrder ? moProgress(productionOrder) : 0;

  function handleAction(action: "confirm" | "plan" | "start" | "cancel") {
    const service = getSwantaraService().productionOrders;
    const numOrgId = Number(orgId);
    const numProductionOrderId = Number(productionOrderId);

    let promise: Promise<unknown>;
    switch (action) {
      case "confirm":
        promise = service.confirm(numOrgId, numProductionOrderId);
        break;
      case "plan":
        promise = service.plan(numOrgId, numProductionOrderId);
        break;
      case "start":
        promise = service.start(numOrgId, numProductionOrderId);
        break;
      case "cancel":
        promise = service.cancel(numOrgId, numProductionOrderId);
        break;
    }

    void promise.then(() => {
      toast.success(t("saved"));
      void moQuery.refetch();
    });
  }

  function handleGenerateShopTasks() {
    setGeneratingTasks(true);
    void getSwantaraService()
      .productionOrders.shopTasks.generate(Number(orgId), Number(productionOrderId))
      .then(() => {
        toast.success(t("shopTasksGenerated"));
        void shopTasksQuery.refetch();
      })
      .catch(() => toast.error(t("saveFailed")))
      .finally(() => setGeneratingTasks(false));
  }

  function handleShopTaskAction(task: ShopTask, action: "confirm" | "start") {
    const service = getSwantaraService().productionOrders.shopTasks;
    const promise =
      action === "confirm"
        ? service.confirm(Number(orgId), Number(productionOrderId), task.id)
        : service.start(Number(orgId), Number(productionOrderId), task.id);
    void promise
      .then(() => {
        toast.success(t("saved"));
        void shopTasksQuery.refetch();
      })
      .catch(() => toast.error(t("saveFailed")));
  }

  if (moQuery.isLoading) {
    return <div className="text-muted-foreground">{tCommon("loading")}</div>;
  }

  if (!productionOrder) {
    return <div className="text-muted-foreground">{t("orderNotFound")}</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href={"/production-orders"}>
            <ArrowLeft />
            <span>{t("backToOrders")}</span>
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CardTitle>{productionOrder.name ?? `MO-${productionOrder.id}`}</CardTitle>
              <Badge variant="outline" className={moStateTone(state)}>
                {moState(state)}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              {canConfirmMo(state) ? (
                <Button size="sm" onClick={() => handleAction("confirm")}>
                  <CheckCircle2 />
                  <span>{t("confirmAction")}</span>
                </Button>
              ) : null}
              {canPlanMo(state) ? (
                <Button size="sm" onClick={() => handleAction("plan")}>
                  <Play />
                  <span>{t("planAction")}</span>
                </Button>
              ) : null}
              {canStartMo(state) ? (
                <Button size="sm" onClick={() => handleAction("start")}>
                  <Play />
                  <span>{t("startAction")}</span>
                </Button>
              ) : null}
              {canProduceMo(state) ? (
                <>
                  <Button size="sm" onClick={() => setConsumeOpen(true)}>
                    <span>{t("consumeAction")}</span>
                  </Button>
                  <Button size="sm" onClick={() => setProduceOpen(true)}>
                    <span>{t("produceAction")}</span>
                  </Button>
                </>
              ) : null}
              {canSettleMo(state) ? (
                <Button size="sm" variant="outline" onClick={() => setSettleOpen(true)}>
                  <span>{t("settleAction")}</span>
                </Button>
              ) : null}
              {state === "planned" || state === "in_progress" ? (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={generatingTasks}
                  onClick={handleGenerateShopTasks}
                >
                  <span>{t("generateShopTasks")}</span>
                </Button>
              ) : null}
              {canCancelMo(state) ? (
                <Button size="sm" variant="destructive" onClick={() => handleAction("cancel")}>
                  <XCircle />
                  <span>{tCommon("cancel")}</span>
                </Button>
              ) : null}
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">{t("colItem")}</span>
            <span className="">{productionOrder.itemId ? `#${productionOrder.itemId}` : "—"}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">{t("qty")}</span>
            <span className=" tabular-nums">
              {productionOrder.qtyProduced} / {productionOrder.qtyToProduce}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">{t("colPlannedStart")}</span>
            <span className="">
              {productionOrder.datePlannedStart
                ? formatDateTime(productionOrder.datePlannedStart)
                : "—"}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">{t("plannedEnd")}</span>
            <span className="">
              {productionOrder.datePlannedFinish
                ? formatDateTime(productionOrder.datePlannedFinish)
                : "—"}
            </span>
          </div>
          <div className="sm:col-span-2 flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">{t("colProgress")}</span>
            <div className="flex items-center gap-2">
              <Progress value={progress} className="flex-1" />
              <span className={cn("text-sm tabular-nums", moProgressColor(progress))}>
                {progress}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("componentsTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          {components.length === 0 ? (
            <div className="text-muted-foreground text-sm">{t("noComponents")}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 pr-4 ">{t("colComponent")}</th>
                    <th className="pb-2 pr-4 text-right ">{t("colPlanned")}</th>
                    <th className="pb-2 pr-4 text-right ">{t("colConsumed")}</th>
                    <th className="pb-2 ">{t("colProgress")}</th>
                  </tr>
                </thead>
                <tbody>
                  {components.map((c) => {
                    const cProgress = componentConsumptionProgress(c);
                    return (
                      <tr key={c.id} className="border-b last:border-0">
                        <td className="py-2 pr-4">
                          <div className="flex flex-col">
                            <span>{`#${c.itemId}`}</span>
                            <span className="text-xs text-muted-foreground">
                              {c.qtyConsumed}/{c.qtyPlanned}
                            </span>
                          </div>
                        </td>
                        <td className="py-2 pr-4 text-right tabular-nums">{c.qtyPlanned}</td>
                        <td className="py-2 pr-4 text-right tabular-nums">{c.qtyConsumed}</td>
                        <td className="py-2">
                          <div className="flex items-center gap-2">
                            <Progress value={cProgress} className="w-16" />
                            <span className="text-xs tabular-nums text-muted-foreground">
                              {cProgress}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("workOrdersTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          {shopTasks.length === 0 ? (
            <div className="text-muted-foreground text-sm">{t("noWorkOrders")}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 pr-4 ">{t("colWorkOrder")}</th>
                    <th className="pb-2 pr-4 ">{t("colWorkCenter")}</th>
                    <th className="pb-2 pr-4 text-right ">{t("colPlannedDuration")}</th>
                    <th className="pb-2 pr-4 text-right ">{t("colActualDuration")}</th>
                    <th className="pb-2 pr-4 ">{t("colStatus")}</th>
                    <th className="pb-2 ">{t("colActions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {shopTasks.map((wo) => (
                    <tr key={wo.id} className="border-b last:border-0">
                      <td className="py-2 pr-4">{wo.name ?? `WO-${wo.id}`}</td>
                      <td className="py-2 pr-4 text-muted-foreground">
                        {wo.workCenterId ? `#${wo.workCenterId}` : "—"}
                      </td>
                      <td className="py-2 pr-4 text-right tabular-nums">
                        {wo.plannedMinutes ?? "—"}
                      </td>
                      <td className="py-2 pr-4 text-right tabular-nums">
                        {wo.actualMinutes ?? "—"}
                      </td>
                      <td className="py-2 pr-4">
                        <Badge variant="outline">{wo.state}</Badge>
                      </td>
                      <td className="py-2">
                        <div className="flex items-center gap-2">
                          {wo.state === "planned" &&
                          (state === "planned" || state === "in_progress") ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleShopTaskAction(wo, "confirm")}
                            >
                              {t("confirmAction")}
                            </Button>
                          ) : null}
                          {wo.state === "confirmed" && state === "in_progress" ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleShopTaskAction(wo, "start")}
                            >
                              {t("startAction")}
                            </Button>
                          ) : null}
                          {wo.state !== "done" &&
                          wo.state !== "cancelled" &&
                          state === "in_progress" ? (
                            <Button size="sm" variant="outline" onClick={() => setLaborTask(wo)}>
                              {t("recordLabor")}
                            </Button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {consumeOpen ? (
        <ConsumeDialog
          open={consumeOpen}
          onOpenChange={setConsumeOpen}
          orgId={orgId}
          productionOrderId={productionOrderId}
          components={components}
          onSave={() => {
            setConsumeOpen(false);
            void moQuery.refetch();
            void componentsQuery.refetch();
          }}
        />
      ) : null}
      {produceOpen ? (
        <ProduceDialog
          open={produceOpen}
          onOpenChange={setProduceOpen}
          orgId={orgId}
          productionOrderId={productionOrderId}
          productionOrder={productionOrder}
          onSave={() => {
            setProduceOpen(false);
            void moQuery.refetch();
          }}
        />
      ) : null}
      {settleOpen ? (
        <SettleDialog
          open={settleOpen}
          onOpenChange={setSettleOpen}
          orgId={orgId}
          productionOrderId={productionOrderId}
          onSave={() => {
            setSettleOpen(false);
            void moQuery.refetch();
          }}
        />
      ) : null}
      {laborTask ? (
        <LaborDialog
          open
          onOpenChange={() => setLaborTask(null)}
          orgId={orgId}
          productionOrderId={productionOrderId}
          shopTask={laborTask}
          onSave={() => {
            setLaborTask(null);
            void shopTasksQuery.refetch();
          }}
        />
      ) : null}
    </div>
  );
}
