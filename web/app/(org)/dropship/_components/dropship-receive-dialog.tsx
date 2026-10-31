"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { EntityFormDialog } from "@/components/entity-form-dialog";
import { FormField } from "@/components/form";
import { Input } from "@/components/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/select";
import { useOrgListQuery } from "@/lib/hooks/use-org-query";
import type { Journal, PurchaseOrder } from "@/lib/services/swantara";
import { getSwantaraService } from "@/lib/services/swantara";
import { getLocalDateString } from "@/lib/utils";
import { zodResolver } from "@/lib/utils/zod-resolver";

function useSchema() {
  const t = useTranslations("Dropship");
  return z.object({
    purchaseOrderId: z.string().min(1, t("validationPurchaseOrderRequired")),
    journalId: z.string().min(1, t("validationJournalRequired")),
    date: z.string(),
  });
}
type Values = z.infer<ReturnType<typeof useSchema>>;

export function DropshipReceiveDialog({
  open,
  onOpenChange,
  orgId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
}) {
  const t = useTranslations("Dropship");
  const tCommon = useTranslations("Common");
  const router = useRouter();
  const schema = useSchema();

  const ordersQuery = useOrgListQuery<{ orders: PurchaseOrder[] }, Record<string, never>>(
    "purchaseOrders",
    (organizationId) => getSwantaraService().purchaseOrders.list(organizationId),
  );
  const journalsQuery = useOrgListQuery<{ journals: Journal[] }, Record<string, never>>(
    "journals",
    (organizationId) => getSwantaraService().journals.list(organizationId),
  );

  const orders = (ordersQuery.data?.orders ?? []).filter(
    (order) => order.state === "confirmed" || order.state === "sent",
  );
  const journals = journalsQuery.data?.journals ?? [];

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      purchaseOrderId: "",
      journalId: "",
      date: getLocalDateString(),
    },
  });

  const mutation = useMutation({
    mutationFn: (values: Values) =>
      getSwantaraService().dropshipOrders.receive(Number(orgId), Number(values.purchaseOrderId), {
        journalId: Number(values.journalId),
        date: values.date || undefined,
      }),
    onSuccess: (result) => {
      toast.success(t("receiveSuccess"));
      onOpenChange(false);
      router.push(`/purchases/orders/${result.purchaseOrder.id}`);
    },
    onError: () => toast.error(t("receiveFailed")),
  });

  return (
    <EntityFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("receiveTitle")}
      description={t("receiveDescription")}
      form={form}
      onSubmit={(values) => mutation.mutate(values)}
      isPending={mutation.isPending}
      submitLabel={t("submitReceive")}
      cancelLabel={tCommon("cancel")}
    >
      <div className="flex flex-col gap-4">
        <FormField name="purchaseOrderId" label={t("fieldPurchaseOrder")}>
          {({ field, id }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id={id} aria-label={t("fieldPurchaseOrder")}>
                <SelectValue placeholder={t("selectPurchaseOrder")} />
              </SelectTrigger>
              <SelectContent>
                {orders.map((order) => (
                  <SelectItem key={order.id} value={String(order.id)}>
                    {order.name ?? `PO-${order.id}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </FormField>
        <FormField name="journalId" label={t("fieldJournal")}>
          {({ field, id }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id={id} aria-label={t("fieldJournal")}>
                <SelectValue placeholder={t("selectJournal")} />
              </SelectTrigger>
              <SelectContent>
                {journals.map((journal) => (
                  <SelectItem key={journal.id} value={String(journal.id)}>
                    {journal.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </FormField>
        <FormField name="date" label={t("fieldDate")}>
          {({ field, id }) => <Input {...field} id={id} type="date" />}
        </FormField>
      </div>
    </EntityFormDialog>
  );
}
