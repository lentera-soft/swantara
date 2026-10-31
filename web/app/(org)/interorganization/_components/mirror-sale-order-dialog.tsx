"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { EntityFormDialog } from "@/components/entity-form-dialog";
import { FormField } from "@/components/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/select";
import { useOrgListQuery } from "@/lib/hooks/use-org-query";
import { getSwantaraService } from "@/lib/services/swantara";
import { zodResolver } from "@/lib/utils/zod-resolver";

function useSchema() {
  const t = useTranslations("Interorganization");
  return z.object({
    saleOrderId: z.string().min(1, t("validationSaleOrderRequired")),
    toOrganizationId: z.string().min(1, t("validationOrganizationRequired")),
  });
}
type Values = z.infer<ReturnType<typeof useSchema>>;

export function MirrorSaleOrderDialog({
  open,
  onOpenChange,
  orgId,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  onSuccess: () => void;
}) {
  const t = useTranslations("Interorganization");
  const tCommon = useTranslations("Common");
  const schema = useSchema();

  const ordersQuery = useOrgListQuery<
    { orders: { id: number; name: string | null; state: string }[] },
    Record<string, never>
  >("saleOrders", (organizationId) => getSwantaraService().saleOrders.list(organizationId));
  const organizationsQuery = useQuery({
    queryKey: ["organizations"],
    queryFn: () => getSwantaraService().organizations.list(),
  });

  const orders = (ordersQuery.data?.orders ?? []).filter(
    (order) => order.state !== "draft" && order.state !== "cancelled",
  );
  const organizations = (organizationsQuery.data?.organizations ?? []).filter(
    (organization) => String(organization.id) !== orgId,
  );

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { saleOrderId: "", toOrganizationId: "" },
  });

  const mutation = useMutation({
    mutationFn: (values: Values) =>
      getSwantaraService().interorganizationTransactions.mirrorSaleOrder(
        Number(orgId),
        Number(values.saleOrderId),
        { toOrganizationId: Number(values.toOrganizationId) },
      ),
    onSuccess: () => {
      toast.success(t("mirrorSuccess"));
      onSuccess();
    },
    onError: () => toast.error(t("mirrorFailed")),
  });

  return (
    <EntityFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("mirrorSaleOrderTitle")}
      description={t("mirrorSaleOrderDescription")}
      form={form}
      onSubmit={(values) => mutation.mutate(values)}
      isPending={mutation.isPending}
      submitLabel={tCommon("save")}
      cancelLabel={tCommon("cancel")}
      className="sm:max-w-lg"
    >
      <div className="flex flex-col gap-4">
        <FormField name="saleOrderId" label={t("source_sale_order")}>
          {({ field, id }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id={id} aria-label={t("source_sale_order")}>
                <SelectValue placeholder={t("source_sale_order")} />
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
        <FormField name="toOrganizationId" label={t("fieldToOrganization")}>
          {({ field, id }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id={id} aria-label={t("fieldToOrganization")}>
                <SelectValue placeholder={t("selectOrganization")} />
              </SelectTrigger>
              <SelectContent>
                {organizations.map((organization) => (
                  <SelectItem key={organization.id} value={String(organization.id)}>
                    {organization.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </FormField>
      </div>
    </EntityFormDialog>
  );
}
