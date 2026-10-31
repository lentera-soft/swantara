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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/select";
import { useOrgListQuery } from "@/lib/hooks/use-org-query";
import type { Account, Journal } from "@/lib/services/swantara";
import { getSwantaraService } from "@/lib/services/swantara";

type SettleDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  productionOrderId: string;
  onSave: () => void;
};

function useSettleSchema() {
  return z.object({
    journalId: z.string().min(1, "required"),
    wipAccountId: z.string().min(1, "required"),
    varianceAccountId: z.string().min(1, "required"),
  });
}

export function SettleDialog({
  open,
  onOpenChange,
  orgId,
  productionOrderId,
  onSave,
}: SettleDialogProps) {
  const t = useTranslations("ProductionOrders");
  const tCommon = useTranslations("Common");
  const schema = useSettleSchema();
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
      journalId: "",
      wipAccountId: "",
      varianceAccountId: "",
    },
  });

  function handleSubmit(values: Values) {
    return getSwantaraService()
      .productionOrders.settle(Number(orgId), Number(productionOrderId), {
        journalId: Number(values.journalId),
        wipAccountId: Number(values.wipAccountId),
        varianceAccountId: Number(values.varianceAccountId),
      })
      .then(() => {
        toast.success(t("varianceSettled"));
        onSave();
      })
      .catch(() => {});
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("settleTitle")}</DialogTitle>
          <DialogDescription>{t("settleDescription")}</DialogDescription>
        </DialogHeader>
        <Form form={form} onSubmit={handleSubmit}>
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
          <FormField name="varianceAccountId" label={t("varianceAccount")}>
            {({ field, id }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id={id} aria-label={t("varianceAccount")}>
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
            <SubmitButton>{t("settleAction")}</SubmitButton>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
