"use client";

import { zodResolver } from "@hookform/resolvers/zod";
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
import { Textarea } from "@/components/textarea";
import type { Item, Recipe, StockLocation } from "@/lib/services/swantara";
import { getSwantaraService } from "@/lib/services/swantara";

type MoFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  products: Item[];
  recipes?: Recipe[];
  locations?: StockLocation[];
  onSave: () => void;
};

function useMoFormSchema() {
  const t = useTranslations("ProductionOrders");
  return z.object({
    itemId: z.string().min(1, t("validation_itemRequired")),
    recipeId: z.string().min(1, t("validation_recipeRequired")),
    srcLocationId: z.string().min(1, t("validation_srcLocationRequired")),
    dstLocationId: z.string().min(1, t("validation_dstLocationRequired")),
    qty: z
      .string()
      .min(1, t("validation_qtyRequired"))
      .refine((v) => Number(v) >= 1, t("validation_qtyRequired")),
    note: z.string(),
  });
}

export function MoFormDialog({
  open,
  onOpenChange,
  orgId,
  products,
  recipes = [],
  locations = [],
  onSave,
}: MoFormDialogProps) {
  const t = useTranslations("ProductionOrders");
  const tCommon = useTranslations("Common");
  const schema = useMoFormSchema();
  type Values = z.infer<typeof schema>;

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      itemId: "",
      recipeId: "",
      srcLocationId: "",
      dstLocationId: "",
      qty: "1",
      note: "",
    },
  });

  const itemId = Number(form.watch("itemId"));
  const itemRecipes = recipes.filter((recipe) => recipe.itemId === itemId && recipe.active);

  function handleSubmit(values: Values) {
    return getSwantaraService()
      .productionOrders.create(Number(orgId), {
        itemId: Number(values.itemId),
        recipeId: Number(values.recipeId),
        qtyToProduce: Number(values.qty) || 1,
        srcLocationId: Number(values.srcLocationId),
        dstLocationId: Number(values.dstLocationId),
      })
      .then(() => {
        toast.success(t("orderCreated"));
        onSave();
      })
      .catch(() => {});
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("newOrder")}</DialogTitle>
          <DialogDescription>{t("formDescription")}</DialogDescription>
        </DialogHeader>
        <Form form={form} onSubmit={handleSubmit}>
          <FormField name="itemId" label={t("colItem")}>
            {({ field, id }) => (
              <Select
                value={field.value}
                onValueChange={(value) => {
                  field.onChange(value);
                  form.setValue("recipeId", "");
                }}
              >
                <SelectTrigger id={id} aria-label={t("colItem")}>
                  <SelectValue placeholder={t("selectItem")} />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </FormField>
          <FormField name="recipeId" label={t("colRecipe")}>
            {({ field, id }) => (
              <Select value={field.value} onValueChange={field.onChange} disabled={!itemId}>
                <SelectTrigger id={id} aria-label={t("colRecipe")}>
                  <SelectValue placeholder={t("selectRecipe")} />
                </SelectTrigger>
                <SelectContent>
                  {itemRecipes.map((recipe) => (
                    <SelectItem key={recipe.id} value={String(recipe.id)}>
                      {recipe.code ?? `BOM-${recipe.id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField name="srcLocationId" label={t("colSrcLocation")}>
              {({ field, id }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id={id} aria-label={t("colSrcLocation")}>
                    <SelectValue placeholder={t("selectLocation")} />
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
            <FormField name="dstLocationId" label={t("colDstLocation")}>
              {({ field, id }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id={id} aria-label={t("colDstLocation")}>
                    <SelectValue placeholder={t("selectLocation")} />
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
          <FormField name="qty" label={t("colQtyToProduce")}>
            {({ field, id }) => <Input {...field} id={id} type="number" min="1" />}
          </FormField>
          <FormField name="note" label={t("note")}>
            {({ field, id }) => <Textarea {...field} id={id} rows={3} />}
          </FormField>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {tCommon("cancel")}
            </Button>
            <SubmitButton>{t("createOrder")}</SubmitButton>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
