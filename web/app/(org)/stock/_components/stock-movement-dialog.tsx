"use client";

import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/dialog";
import { Form, FormField, SubmitButton } from "@/components/form";
import { Input } from "@/components/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/select";
import type { Item, StockLocation } from "@/lib/services/swantara";
import { getSwantaraService } from "@/lib/services/swantara";
import { zodResolver } from "@/lib/utils/zod-resolver";

type TFn = (key: string, values?: Record<string, string | number>) => string;

function useMovementSchema() {
  const t = (useTranslations as unknown as (ns: string) => TFn)("Stock");
  return z.object({
    itemId: z.coerce.number().min(1, t("validationItemRequired")),
    qty: z.coerce.number().gt(0, t("validationNonNegative")),
    srcLocationId: z.coerce.number().min(1, t("validationLocationNameRequired")),
    dstLocationId: z.coerce.number().min(1, t("validationLocationNameRequired")),
  });
}

export function StockMovementDialog({
  open,
  onOpenChange,
  orgId,
  items,
  locations,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  items: Item[];
  locations: StockLocation[];
  onSave: () => void;
}) {
  const t = (useTranslations as unknown as (ns: string) => TFn)("Stock");
  const tCommon = useTranslations("Common");
  const schema = useMovementSchema();
  type Values = z.infer<typeof schema>;

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { itemId: 0, qty: 0, srcLocationId: 0, dstLocationId: 0 },
  });

  function handleSubmit(values: Values) {
    return getSwantaraService()
      .inventory.createStockMovement(Number(orgId), {
        organizationId: Number(orgId),
        itemId: values.itemId,
        qty: String(values.qty),
        unitId: null,
        srcLocationId: values.srcLocationId,
        dstLocationId: values.dstLocationId,
        batchId: null,
        unitCost: null,
        originType: null,
        originId: null,
        scheduledDate: null,
      })
      .then(() => onSave())
      .catch(() => void toast.error(t("toastFailed")));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("newMovement")}</DialogTitle>
          <DialogDescription>{t("movementsDescription")}</DialogDescription>
        </DialogHeader>
        <Form form={form} onSubmit={handleSubmit}>
          <div className="flex flex-col gap-4">
            <FormField name="itemId" label={t("fieldItem")}>
              {({ field, id }) => (
                <Select
                  value={field.value ? String(field.value) : ""}
                  onValueChange={(value) => field.onChange(Number(value ?? 0))}
                >
                  <SelectTrigger id={id} aria-label={t("fieldItem")}>
                    <SelectValue placeholder={t("fieldItem")} />
                  </SelectTrigger>
                  <SelectContent>
                    {items.map((item) => (
                      <SelectItem key={item.id} value={String(item.id)}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </FormField>
            <FormField name="qty" label={t("fieldQty")}>
              {({ field, id }) => <Input {...field} id={id} type="number" min="0" step="any" />}
            </FormField>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField name="srcLocationId" label={t("fieldFromLocation")}>
                {({ field, id }) => (
                  <Select
                    value={field.value ? String(field.value) : ""}
                    onValueChange={(value) => field.onChange(Number(value ?? 0))}
                  >
                    <SelectTrigger id={id} aria-label={t("fieldFromLocation")}>
                      <SelectValue placeholder={t("fieldFromLocation")} />
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
              <FormField name="dstLocationId" label={t("fieldToLocation")}>
                {({ field, id }) => (
                  <Select
                    value={field.value ? String(field.value) : ""}
                    onValueChange={(value) => field.onChange(Number(value ?? 0))}
                  >
                    <SelectTrigger id={id} aria-label={t("fieldToLocation")}>
                      <SelectValue placeholder={t("fieldToLocation")} />
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
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {tCommon("cancel")}
            </Button>
            <SubmitButton>{tCommon("save")}</SubmitButton>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
