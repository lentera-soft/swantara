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
import type { Contact, SaleOrder, StockLocation } from "@/lib/services/swantara";
import { getSwantaraService } from "@/lib/services/swantara";
import { getLocalDateString } from "@/lib/utils";
import { zodResolver } from "@/lib/utils/zod-resolver";

function useSchema() {
  const t = useTranslations("Dropship");
  return z.object({
    saleOrderId: z.string().min(1, t("validationSaleOrderRequired")),
    supplierId: z.string().min(1, t("validationSupplierRequired")),
    destLocationId: z.string(),
    date: z.string(),
  });
}
type Values = z.infer<ReturnType<typeof useSchema>>;

export function DropshipCreateDialog({
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

  const ordersQuery = useOrgListQuery<{ orders: SaleOrder[] }, Record<string, never>>(
    "saleOrders",
    (organizationId) => getSwantaraService().saleOrders.list(organizationId),
  );
  const contactsQuery = useOrgListQuery<{ contacts: Contact[] }, Record<string, never>>(
    "contacts",
    (organizationId) => getSwantaraService().contacts.list(organizationId),
  );
  const locationsQuery = useOrgListQuery<{ locations: StockLocation[] }, Record<string, never>>(
    "stockLocations",
    (organizationId) => getSwantaraService().inventory.stockLocations(organizationId),
  );

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      saleOrderId: "",
      supplierId: "",
      destLocationId: "",
      date: getLocalDateString(),
    },
  });

  const orders = (ordersQuery.data?.orders ?? []).filter(
    (order) => order.state !== "cancelled" && order.state !== "done",
  );
  const contacts = contactsQuery.data?.contacts ?? [];
  const locations = locationsQuery.data?.locations ?? [];

  const mutation = useMutation({
    mutationFn: (values: Values) =>
      getSwantaraService().dropshipOrders.create(Number(orgId), {
        saleOrderId: Number(values.saleOrderId),
        supplierId: Number(values.supplierId),
        destLocationId: values.destLocationId ? Number(values.destLocationId) : null,
        date: values.date || undefined,
      }),
    onSuccess: (result) => {
      toast.success(t("createSuccess"));
      onOpenChange(false);
      router.push(`/purchases/orders/${result.purchaseOrder.id}`);
    },
    onError: () => toast.error(t("createFailed")),
  });

  return (
    <EntityFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("createTitle")}
      description={t("createDescription")}
      form={form}
      onSubmit={(values) => mutation.mutate(values)}
      isPending={mutation.isPending}
      submitLabel={t("submitCreate")}
      cancelLabel={tCommon("cancel")}
    >
      <div className="flex flex-col gap-4">
        <FormField name="saleOrderId" label={t("fieldSaleOrder")}>
          {({ field, id }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id={id} aria-label={t("fieldSaleOrder")}>
                <SelectValue placeholder={t("fieldSaleOrder")} />
              </SelectTrigger>
              <SelectContent>
                {orders.map((order) => (
                  <SelectItem key={order.id} value={String(order.id)}>
                    {order.name ?? `SO-${order.id}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </FormField>
        <FormField name="supplierId" label={t("fieldSupplier")}>
          {({ field, id }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id={id} aria-label={t("fieldSupplier")}>
                <SelectValue placeholder={t("selectSupplier")} />
              </SelectTrigger>
              <SelectContent>
                {contacts.map((contact) => (
                  <SelectItem key={contact.id} value={String(contact.id)}>
                    {contact.displayName || contact.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </FormField>
        <FormField name="destLocationId" label={t("fieldDestLocation")}>
          {({ field, id }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id={id} aria-label={t("fieldDestLocation")}>
                <SelectValue placeholder={t("selectDestLocation")} />
              </SelectTrigger>
              <SelectContent>
                {locations.map((location) => (
                  <SelectItem key={location.id} value={String(location.id)}>
                    {location.name}
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
