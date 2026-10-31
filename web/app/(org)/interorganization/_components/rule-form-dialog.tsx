"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { EntityFormDialog } from "@/components/entity-form-dialog";
import { FormField } from "@/components/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/select";
import { Switch } from "@/components/switch";
import { useOrganizationId } from "@/lib/hooks/use-org-context";
import type { InterorganizationRule } from "@/lib/services/swantara";
import { getSwantaraService } from "@/lib/services/swantara";
import { zodResolver } from "@/lib/utils/zod-resolver";

function useRuleSchema() {
  const t = useTranslations("Interorganization");
  return z
    .object({
      toOrganizationId: z.string().min(1, t("validationOrganizationRequired")),
      autoMirror: z.boolean(),
      supplierContactId: z.string(),
      customerContactId: z.string(),
    })
    .superRefine((values, ctx) => {
      if (values.autoMirror && (!values.supplierContactId || !values.customerContactId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["supplierContactId"],
          message: t("validationContactsRequired"),
        });
      }
    });
}
type RuleValues = z.infer<ReturnType<typeof useRuleSchema>>;

function toDefaultValues(initial?: InterorganizationRule | null): RuleValues {
  return {
    toOrganizationId: initial?.toOrganizationId ? String(initial.toOrganizationId) : "",
    autoMirror: initial?.autoMirror ?? true,
    supplierContactId: initial?.supplierContactId ? String(initial.supplierContactId) : "",
    customerContactId: initial?.customerContactId ? String(initial.customerContactId) : "",
  };
}

export function InterorganizationRuleFormDialog({
  open,
  onOpenChange,
  initial,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: InterorganizationRule | null;
  onSave: () => void;
}) {
  const t = useTranslations("Interorganization");
  const tCommon = useTranslations("Common");
  const organizationId = useOrganizationId();
  const schema = useRuleSchema();

  const form = useForm<RuleValues>({
    resolver: zodResolver(schema),
    defaultValues: toDefaultValues(initial),
  });

  const autoMirror = form.watch("autoMirror");
  const toOrganizationId = form.watch("toOrganizationId");
  const targetOrganizationId = toOrganizationId ? Number(toOrganizationId) : null;

  useEffect(() => {
    if (open) {
      form.reset(toDefaultValues(initial));
    }
  }, [open, initial, form]);

  const organizationsQuery = useQuery({
    queryKey: ["organizations"],
    queryFn: () => getSwantaraService().organizations.list(),
    enabled: open,
  });

  const contactsQuery = useQuery({
    queryKey: ["contacts", targetOrganizationId],
    queryFn: () => getSwantaraService().contacts.list(targetOrganizationId as number),
    enabled: open && targetOrganizationId != null,
  });

  const organizations = (organizationsQuery.data?.organizations ?? []).filter(
    (organization) => organization.id !== organizationId,
  );
  const contacts = contactsQuery.data?.contacts ?? [];

  const mutation = useMutation({
    mutationFn: (values: RuleValues) => {
      const payload = {
        fromOrganizationId: organizationId,
        toOrganizationId: Number(values.toOrganizationId),
        autoMirror: values.autoMirror,
        supplierContactId: values.supplierContactId ? Number(values.supplierContactId) : null,
        customerContactId: values.customerContactId ? Number(values.customerContactId) : null,
      };
      if (initial) {
        return getSwantaraService().interorganizationRules.update(
          organizationId as number,
          initial.id,
          payload,
        );
      }
      return getSwantaraService().interorganizationRules.create(organizationId as number, payload);
    },
    onSuccess: () => {
      toast.success(t("ruleSaved"));
      onSave();
    },
    onError: () => {
      toast.error(t("saveFailed"));
    },
  });

  function handleSubmit(values: RuleValues) {
    if (organizationId == null) return;
    mutation.mutate(values);
  }

  return (
    <EntityFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={initial ? t("editRule") : t("newRule")}
      description={t("ruleDialogDescription")}
      form={form}
      onSubmit={handleSubmit}
      isPending={mutation.isPending}
      submitLabel={tCommon("save")}
      cancelLabel={tCommon("cancel")}
      className="sm:max-w-lg"
    >
      <div className="flex flex-col gap-4">
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

        <FormField name="autoMirror" label={t("fieldAutoMirror")}>
          {({ field }) => (
            <div className="flex items-center gap-3">
              <Switch
                checked={field.value}
                onCheckedChange={(checked) => field.onChange(Boolean(checked))}
                aria-label={t("fieldAutoMirror")}
              />
              <span className="text-sm text-muted-foreground">
                {field.value ? t("autoMirrorOn") : t("autoMirrorOff")}
              </span>
            </div>
          )}
        </FormField>

        <FormField name="supplierContactId" label={t("fieldSupplierContact")}>
          {({ field, id }) => (
            <Select
              value={field.value}
              onValueChange={field.onChange}
              disabled={!autoMirror || targetOrganizationId == null}
            >
              <SelectTrigger id={id} aria-label={t("fieldSupplierContact")}>
                <SelectValue placeholder={t("selectContact")} />
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

        <FormField name="customerContactId" label={t("fieldCustomerContact")}>
          {({ field, id }) => (
            <Select
              value={field.value}
              onValueChange={field.onChange}
              disabled={!autoMirror || targetOrganizationId == null}
            >
              <SelectTrigger id={id} aria-label={t("fieldCustomerContact")}>
                <SelectValue placeholder={t("selectContact")} />
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
      </div>
    </EntityFormDialog>
  );
}
