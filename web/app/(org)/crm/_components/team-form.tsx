"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/button";
import { Form, FormField, SubmitButton } from "@/components/form";
import { FormSection } from "@/components/form-section";
import { Input } from "@/components/input";
import { PageHeader } from "@/components/page-header";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/select";
import { useOrgListQuery } from "@/lib/hooks/use-org-query";
import type { Contact, SalesGroup } from "@/lib/services/swantara";
import { getSwantaraService } from "@/lib/services/swantara";
import { logger } from "@/lib/utils/client-logger";

type TeamFormValues = {
  name: string;
  leaderId: string;
};

export function TeamForm({
  orgId,
  initial,
  cancelHref = "/crm/teams",
}: {
  orgId: string;
  initial?: SalesGroup | null;
  cancelHref?: string;
}) {
  const t = useTranslations("Crm");
  const tCommon = useTranslations("Common");
  const router = useRouter();
  const queryClient = useQueryClient();
  const isEdit = Boolean(initial);

  const schema = z.object({
    name: z.string().min(1, t("validationTeamNameRequired")),
    leaderId: z.string(),
  });

  const contactsQuery = useOrgListQuery<{ contacts: Contact[] }, Record<string, never>>(
    "contacts",
    (organizationId) => getSwantaraService().contacts.list(organizationId),
  );
  const contacts = (contactsQuery.data?.contacts ?? []).filter((contact) => contact.isEmployee);

  const form = useForm<TeamFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initial?.name ?? "",
      leaderId: initial?.leaderId != null ? String(initial.leaderId) : "",
    },
  });

  const saveMutation = useMutation({
    mutationFn: (values: TeamFormValues) => {
      const leaderId = values.leaderId === "" ? null : Number(values.leaderId);
      if (isEdit && initial) {
        return getSwantaraService().salesGroups.update(Number(orgId), initial.id, {
          name: values.name,
          leaderId,
        });
      }
      return getSwantaraService().salesGroups.create(Number(orgId), {
        name: values.name,
        leaderId,
      });
    },
    onSuccess: ({ team }) => {
      toast.success(isEdit ? t("teamUpdated") : t("teamCreated"));
      void queryClient.invalidateQueries({ queryKey: ["salesGroups"] });
      router.push(`/crm/teams/${team.id}`);
    },
    onError: (error) => {
      logger.error({ err: error }, "Failed to save sales team");
      toast.error(t("saveTeamFailed"));
    },
  });

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <Form
        form={form}
        onSubmit={(values) => saveMutation.mutate(values)}
        className="flex flex-col gap-4"
      >
        <FormSection title={t("teamDetails")}>
          <FormField name="name" label={t("fieldName")} className="sm:col-span-2">
            {({ field, id }) => <Input {...field} id={id} placeholder={t("fieldName")} autoFocus />}
          </FormField>
          <FormField name="leaderId" label={t("teamLeader")} className="sm:col-span-2">
            {({ field, id }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id={id} aria-label={t("teamLeader")}>
                  <SelectValue placeholder={t("noTeamLeader")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{t("noTeamLeader")}</SelectItem>
                  {contacts.map((contact) => (
                    <SelectItem key={contact.id} value={String(contact.id)}>
                      {contact.displayName || contact.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </FormField>
        </FormSection>

        <div className="flex items-center justify-end gap-2">
          <Button type="button" variant="outline" disabled={saveMutation.isPending} asChild>
            <a href={cancelHref}>{tCommon("cancel")}</a>
          </Button>
          <SubmitButton loading={saveMutation.isPending} disabled={saveMutation.isPending}>
            {isEdit ? tCommon("save") : t("addTeam")}
          </SubmitButton>
        </div>
      </Form>
    </div>
  );
}
