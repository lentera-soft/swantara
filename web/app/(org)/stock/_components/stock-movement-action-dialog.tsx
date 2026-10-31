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
import type { Journal, StockMovement } from "@/lib/services/swantara";
import { getSwantaraService } from "@/lib/services/swantara";
import { zodResolver } from "@/lib/utils/zod-resolver";

type TFn = (key: string, values?: Record<string, string | number>) => string;

function useActionSchema() {
  const t = (useTranslations as unknown as (ns: string) => TFn)("Stock");
  return z.object({
    journalId: z.coerce.number().min(1, t("validationJournalRequired")),
    date: z.string().min(1, t("validationDateRequired")),
    unitCost: z.coerce.number().min(0, t("validationNonNegative")),
  });
}

export function StockMovementActionDialog({
  open,
  onOpenChange,
  orgId,
  movement,
  action,
  journals,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  movement: StockMovement | null;
  action: "receive" | "ship";
  journals: Journal[];
  onSave: () => void;
}) {
  const t = (useTranslations as unknown as (ns: string) => TFn)("Stock");
  const tCommon = useTranslations("Common");
  const schema = useActionSchema();
  type Values = z.infer<typeof schema>;

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      journalId: 0,
      date: new Date().toISOString().slice(0, 10),
      unitCost: 0,
    },
  });

  function handleSubmit(values: Values) {
    if (!movement) return;
    const service = getSwantaraService().inventory;
    const promise =
      action === "receive"
        ? service.receive(Number(orgId), movement.id, {
            unitCost: String(values.unitCost),
            journalId: values.journalId,
            date: values.date,
          })
        : service.ship(Number(orgId), movement.id, {
            journalId: values.journalId,
            date: values.date,
          });
    return promise.then(() => onSave()).catch(() => void toast.error(t("toastFailed")));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {action === "receive" ? t("receiveMovement") : t("shipMovement")}
          </DialogTitle>
          <DialogDescription>{t("movementsDescription")}</DialogDescription>
        </DialogHeader>
        <Form form={form} onSubmit={handleSubmit}>
          <div className="flex flex-col gap-4">
            <FormField name="journalId" label={t("fieldJournal")}>
              {({ field, id }) => (
                <Select
                  value={field.value ? String(field.value) : ""}
                  onValueChange={(value) => field.onChange(Number(value ?? 0))}
                >
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
            {action === "receive" ? (
              <FormField name="unitCost" label={t("fieldUnitCost")}>
                {({ field, id }) => <Input {...field} id={id} type="number" min="0" step="any" />}
              </FormField>
            ) : null}
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
