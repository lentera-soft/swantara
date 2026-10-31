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
import type { Account, InvoiceSummary, Journal } from "@/lib/services/swantara";
import { getSwantaraService } from "@/lib/services/swantara";
import { zodResolver } from "@/lib/utils/zod-resolver";

const schema = z.object({
  invoiceId: z.string().min(1),
  toOrganizationId: z.string().min(1),
  journalId: z.string().min(1),
  expenseAccountId: z.string().min(1),
});
type Values = z.infer<typeof schema>;

export function MirrorInvoiceDialog({
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

  const invoicesQuery = useOrgListQuery<{ invoices: InvoiceSummary[] }, Record<string, never>>(
    "invoices",
    (organizationId) => getSwantaraService().invoices.list(organizationId),
  );
  const journalsQuery = useOrgListQuery<{ journals: Journal[] }, Record<string, never>>(
    "journals",
    (organizationId) => getSwantaraService().journals.list(organizationId),
  );
  const accountsQuery = useOrgListQuery<{ accounts: Account[] }, Record<string, never>>(
    "accounts",
    (organizationId) => getSwantaraService().accounts.list(organizationId),
  );
  const organizationsQuery = useQuery({
    queryKey: ["organizations"],
    queryFn: () => getSwantaraService().organizations.list(),
  });

  const invoices = (invoicesQuery.data?.invoices ?? []).filter(
    (invoice) => invoice.type === "customer" && invoice.state === "posted",
  );
  const journals = journalsQuery.data?.journals ?? [];
  const accounts = (accountsQuery.data?.accounts ?? []).filter(
    (account) => account.type === "expense" || account.type === "cogs",
  );
  const organizations = (organizationsQuery.data?.organizations ?? []).filter(
    (organization) => String(organization.id) !== orgId,
  );

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      invoiceId: "",
      toOrganizationId: "",
      journalId: "",
      expenseAccountId: "",
    },
  });

  const mutation = useMutation({
    mutationFn: (values: Values) =>
      getSwantaraService().interorganizationTransactions.mirrorInvoice(
        Number(orgId),
        Number(values.invoiceId),
        {
          toOrganizationId: Number(values.toOrganizationId),
          journalId: Number(values.journalId),
          expenseAccountId: Number(values.expenseAccountId),
        },
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
      title={t("mirrorInvoiceTitle")}
      description={t("mirrorInvoiceDescription")}
      form={form}
      onSubmit={(values) => mutation.mutate(values)}
      isPending={mutation.isPending}
      submitLabel={tCommon("save")}
      cancelLabel={tCommon("cancel")}
      className="sm:max-w-lg"
    >
      <div className="flex flex-col gap-4">
        <FormField name="invoiceId" label={t("source_customer_invoice")}>
          {({ field, id }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id={id} aria-label={t("source_customer_invoice")}>
                <SelectValue placeholder={t("source_customer_invoice")} />
              </SelectTrigger>
              <SelectContent>
                {invoices.map((invoice) => (
                  <SelectItem key={invoice.id} value={String(invoice.id)}>
                    {invoice.name ?? `INV-${invoice.id}`}
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
        <FormField name="expenseAccountId" label={t("fieldExpenseAccount")}>
          {({ field, id }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id={id} aria-label={t("fieldExpenseAccount")}>
                <SelectValue placeholder={t("selectAccount")} />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={String(account.id)}>
                    {account.code} · {account.name}
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
