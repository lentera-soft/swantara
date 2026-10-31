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
import { useOrgListQuery } from "@/lib/hooks/use-org-query";
import type { Account, Journal, ShopTask } from "@/lib/services/swantara";
import { getSwantaraService } from "@/lib/services/swantara";

type LaborDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  productionOrderId: string;
  shopTask: ShopTask;
  onSave: () => void;
};

function useLaborSchema() {
  return z.object({
    minutes: z.string().refine((value) => Number(value) > 0, "required"),
    journalId: z.string().min(1, "required"),
    wipAccountId: z.string().min(1, "required"),
    appliedLaborAccountId: z.string().min(1, "required"),
  });
}

export function LaborDialog({
  open,
  onOpenChange,
  orgId,
  productionOrderId,
  shopTask,
  onSave,
}: LaborDialogProps) {
  const t = useTranslations("ProductionOrders");
  const tCommon = useTranslations("Common");
  const schema = useLaborSchema();
  type Values = z.infer<typeof schema>;

  const journalsQuery = useOrgListQuery<{ journals: Journal[] }, Record<string, never>>(
    "journals",
    (organizationId) => getSwantaraService().journals.list(organizationId),
  );
  const accountsQuery = useOrgListQuery<{ accounts: Account[] }, Record<string, never>>(
    "accounts",
    (organizationId) => getSwantaraService().accounts.list(organizationId),
  );

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      minutes: String(shopTask.plannedMinutes || 0),
      journalId: "",
      wipAccountId: "",
      appliedLaborAccountId: "",
    },
  });

  function handleSubmit(values: Values) {
    return getSwantaraService()
      .productionOrders.shopTasks.labor(Number(orgId), Number(productionOrderId), shopTask.id, {
        minutes: Number(values.minutes),
        journalId: Number(values.journalId),
        wipAccountId: Number(values.wipAccountId),
        appliedLaborAccountId: Number(values.appliedLaborAccountId),
      })
      .then(() => {
        toast.success(t("laborRecorded"));
        onSave();
      })
      .catch(() => {});
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("laborTitle")}</DialogTitle>
          <DialogDescription>{t("laborDescription")}</DialogDescription>
        </DialogHeader>
        <Form form={form} onSubmit={handleSubmit}>
          <FormField name="minutes" label={t("minutes")}>
            {({ field, id }) => <Input {...field} id={id} type="number" min="0" step="any" />}
          </FormField>
          <FormField name="journalId" label={t("journal")}>
            {({ field, id }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id={id} aria-label={t("journal")}>
                  <SelectValue placeholder={t("selectJournal")} />
                </SelectTrigger>
                <SelectContent>
                  {(journalsQuery.data?.journals ?? []).map((journal) => (
                    <SelectItem key={journal.id} value={String(journal.id)}>
                      {journal.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </FormField>
          <FormField name="wipAccountId" label={t("wipAccount")}>
            {({ field, id }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id={id} aria-label={t("wipAccount")}>
                  <SelectValue placeholder={t("selectAccount")} />
                </SelectTrigger>
                <SelectContent>
                  {(accountsQuery.data?.accounts ?? []).map((account) => (
                    <SelectItem key={account.id} value={String(account.id)}>
                      {`${account.code} ${account.name}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </FormField>
          <FormField name="appliedLaborAccountId" label={t("appliedLaborAccount")}>
            {({ field, id }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id={id} aria-label={t("appliedLaborAccount")}>
                  <SelectValue placeholder={t("selectAccount")} />
                </SelectTrigger>
                <SelectContent>
                  {(accountsQuery.data?.accounts ?? []).map((account) => (
                    <SelectItem key={account.id} value={String(account.id)}>
                      {`${account.code} ${account.name}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </FormField>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {tCommon("cancel")}
            </Button>
            <SubmitButton>{t("recordLabor")}</SubmitButton>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
