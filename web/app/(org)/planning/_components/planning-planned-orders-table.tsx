"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/badge";
import { Button } from "@/components/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/select";
import { useOrganizationId } from "@/lib/hooks/use-org-context";
import { useOrgListQuery, useOrgQuery } from "@/lib/hooks/use-org-query";
import type { Contact, PlanningRun } from "@/lib/services/swantara";
import { getSwantaraService } from "@/lib/services/swantara";
import { formatDate } from "@/lib/utils";

type PlannedSupplysTableProps = {
  run: PlanningRun;
};

export function PlannedSupplysTable({ run }: PlannedSupplysTableProps) {
  const t = useTranslations("Planning");
  const activeOrganizationId = useOrganizationId();
  const [suppliers, setSuppliers] = useState<Record<number, string>>({});
  const [confirmingId, setConfirmingId] = useState<number | null>(null);

  const runDetailQuery = useOrgQuery<{ run: PlanningRun }>(
    "planning.runs",
    run.id,
    (organizationId) => getSwantaraService().planning.runs.get(organizationId, run.id),
  );
  const contactsQuery = useOrgListQuery<{ contacts: Contact[] }, Record<string, never>>(
    "contacts",
    (organizationId) => getSwantaraService().contacts.list(organizationId),
  );

  const runDetail = runDetailQuery.data?.run;
  const plannedOrders = runDetail?.plannedOrders ?? [];
  const supplierOptions = (contactsQuery.data?.contacts ?? []).filter(
    (contact) => contact.isSupplier,
  );

  async function handleConfirm(orderId: number, type: string) {
    const supplierId = Number(suppliers[orderId] ?? "");
    if (type === "purchase" && !supplierId) {
      toast.error(t("selectSupplier"));
      return;
    }
    setConfirmingId(orderId);
    try {
      const organizationId = Number(activeOrganizationId ?? run.organizationId ?? 0);
      await getSwantaraService().planning.confirmPlannedOrder(organizationId, orderId, {
        supplierId: type === "purchase" ? supplierId : 0,
      });
      toast.success(t("ordersConfirmed"));
      await runDetailQuery.refetch();
    } catch {
      toast.error(t("saveFailed"));
    } finally {
      setConfirmingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-lg">{t("plannedOrders")}</h3>
      {plannedOrders.length === 0 ? (
        <div className="text-muted-foreground text-sm">{t("noPlannedOrders")}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-2 pr-4">{t("colItem")}</th>
                <th className="pb-2 pr-4">{t("colType")}</th>
                <th className="pb-2 pr-4 text-right">{t("colQty")}</th>
                <th className="pb-2 pr-4 text-right">{t("colOrderDate")}</th>
                <th className="pb-2 pr-4 text-right">{t("colDueDate")}</th>
                <th className="pb-2 pr-4">{t("colStatus")}</th>
                <th className="pb-2 pr-4">{t("colGeneratedDoc")}</th>
                <th className="pb-2">{t("colActions")}</th>
              </tr>
            </thead>
            <tbody>
              {plannedOrders.map((order) => (
                <tr key={order.id} className="border-b last:border-0">
                  <td className="py-2 pr-4">{`#${order.itemId}`}</td>
                  <td className="py-2 pr-4 text-muted-foreground">{order.type}</td>
                  <td className="py-2 pr-4 text-right tabular-nums">{order.qty}</td>
                  <td className="py-2 pr-4 text-right tabular-nums">
                    {formatDate(order.orderDate, { nullFallback: "—" })}
                  </td>
                  <td className="py-2 pr-4 text-right tabular-nums">
                    {formatDate(order.dueDate, { nullFallback: "—" })}
                  </td>
                  <td className="py-2 pr-4">
                    <Badge
                      variant="outline"
                      className={
                        order.confirmed
                          ? "border-success text-success"
                          : "border-muted-foreground text-muted-foreground"
                      }
                    >
                      {order.confirmed ? t("confirmed") : t("pending")}
                    </Badge>
                  </td>
                  <td className="py-2 pr-4">
                    <Badge variant="outline">{order.generatedDocType ?? "—"}</Badge>
                  </td>
                  <td className="py-2">
                    {order.confirmed ? (
                      <span className="text-muted-foreground text-xs">{t("confirmed")}</span>
                    ) : (
                      <div className="flex items-center gap-2">
                        {order.type === "purchase" ? (
                          <Select
                            value={suppliers[order.id] ?? ""}
                            onValueChange={(value) =>
                              setSuppliers((current) => ({ ...current, [order.id]: value ?? "" }))
                            }
                          >
                            <SelectTrigger className="w-40" aria-label={t("supplier")}>
                              <SelectValue placeholder={t("selectSupplier")} />
                            </SelectTrigger>
                            <SelectContent>
                              {supplierOptions.map((supplier) => (
                                <SelectItem key={supplier.id} value={String(supplier.id)}>
                                  {supplier.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : null}
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={confirmingId === order.id}
                          onClick={() => void handleConfirm(order.id, order.type)}
                        >
                          {t("confirm")}
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
