"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import type { LegacyColumnDef as ColumnDef } from "@tanstack/react-table/legacy";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { InteractiveEntityTable } from "@/app/(org)/_components/interactive-entity-table";
import { RowActions } from "@/app/(org)/_components/row-actions";
import { Button } from "@/components/button";
import { CurrencyField } from "@/components/currency-field";
import { DatePicker } from "@/components/date-picker";
import { EntityFormDialog } from "@/components/entity-form-dialog";
import { FormField } from "@/components/form";
import { FormSection } from "@/components/form-section";
import { Input } from "@/components/input";
import { useActiveOrgCurrency } from "@/lib/hooks/use-org-context";
import { useOrgListQuery } from "@/lib/hooks/use-org-query";
import type { Campaign } from "@/lib/services/swantara";
import { getSwantaraService } from "@/lib/services/swantara";
import { logger } from "@/lib/utils/client-logger";
import { getLocalDateString } from "@/lib/utils/formatters";

function useCampaignSchema() {
  const t = useTranslations("Reference");
  return z.object({
    name: z.string().min(1, t("validationNameRequired")),
    code: z.string(),
    description: z.string(),
    channel: z.string(),
    status: z.string(),
    startDate: z.string(),
    endDate: z.string(),
    budget: z.string(),
  });
}

type CampaignValues = z.infer<ReturnType<typeof useCampaignSchema>>;

export function CampaignsSection({ orgId }: { orgId: string }) {
  const t = useTranslations("Reference");
  const orgCurrency = useActiveOrgCurrency();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Campaign | null>(null);

  const query = useOrgListQuery<{ campaigns: Campaign[] }, Record<string, never>>(
    "campaigns",
    (organizationId) => getSwantaraService().campaigns.list(organizationId),
  );

  const schema = useCampaignSchema();
  const form = useForm<CampaignValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      code: "",
      description: "",
      channel: "",
      status: "",
      startDate: "",
      endDate: "",
      budget: "",
    },
  });

  const campaigns = query.data?.campaigns ?? [];

  const saveMutation = useMutation({
    mutationFn: (values: CampaignValues) => {
      const payload: Record<string, unknown> = {
        name: values.name,
      };
      if (values.code.trim()) payload.code = values.code;
      if (values.description.trim()) payload.description = values.description;
      if (values.channel.trim()) payload.channel = values.channel;
      if (values.status.trim()) payload.status = values.status;
      if (values.startDate.trim()) payload.startDate = `${values.startDate}T00:00:00Z`;
      if (values.endDate.trim()) payload.endDate = `${values.endDate}T00:00:00Z`;
      if (values.budget.trim()) payload.budget = Number(values.budget);
      if (editing) {
        return getSwantaraService().campaigns.update(Number(orgId), editing.id, payload as never);
      }
      return getSwantaraService().campaigns.create(Number(orgId), payload as never);
    },
    onSuccess: () => {
      toast.success(t("campaignSaved"));
      setOpen(false);
      setEditing(null);
      form.reset();
      void query.refetch();
    },
    onError: (error) => {
      logger.error({ err: error }, "Failed to save campaign");
      toast.error(t("toastFailed"));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => getSwantaraService().campaigns.delete(Number(orgId), id),
    onSuccess: () => {
      toast.success(t("campaignDeleted"));
      void query.refetch();
    },
    onError: (error) => {
      logger.error({ err: error }, "Failed to save campaign");
      toast.error(t("toastFailed"));
    },
  });

  function openCreate() {
    setEditing(null);
    form.reset({
      name: "",
      code: "",
      description: "",
      channel: "",
      status: "",
      startDate: "",
      endDate: "",
      budget: "",
    });
    setOpen(true);
  }

  function openEdit(campaign: Campaign) {
    setEditing(campaign);
    setOpen(true);
    form.reset({
      name: campaign.name,
      code: campaign.code ?? "",
      description: campaign.description ?? "",
      channel: campaign.channel ?? "",
      status: campaign.status ?? "",
      startDate: campaign.startDate ? String(campaign.startDate).slice(0, 10) : "",
      endDate: campaign.endDate ? String(campaign.endDate).slice(0, 10) : "",
      budget: campaign.budget != null ? String(campaign.budget) : "",
    });
  }

  const columns: ColumnDef<Campaign>[] = [
    {
      accessorKey: "name",
      header: t("tableName"),
      cell: ({ row }) => <span className="">{row.original.name}</span>,
    },
    {
      accessorKey: "code",
      header: t("fieldCode"),
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">{row.original.code || "—"}</span>
      ),
    },
    {
      accessorKey: "status",
      header: t("fieldStatus"),
      cell: ({ row }) => <span className="">{row.original.status || "—"}</span>,
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <RowActions
          editLabel={t("actionEdit")}
          deleteLabel={t("actionDelete")}
          confirmTitle={t("deleteCampaignTitle")}
          confirmDescription={t("deleteCampaignDescription")}
          onEdit={() => openEdit(row.original)}
          onDelete={() => deleteMutation.mutate(row.original.id)}
        />
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <InteractiveEntityTable
        columns={columns}
        data={campaigns}
        getRowId={(row) => String(row.id)}
        searchKeys={["name", "code", "status"]}
        searchPlaceholder={t("searchCampaignsPlaceholder")}
        filterLabel=""
        statusOptions={[]}
        allLabel=""
        ariaLabel={t("campaignsTitle")}
        emptyTitle={t("campaignsEmpty")}
        status={
          query.isLoading
            ? { type: "loading" }
            : query.isError
              ? {
                  type: "error",
                  message: query.error.message,
                  onRetry: () => void query.refetch(),
                }
              : undefined
        }
        actions={
          <Button size="sm" onClick={openCreate}>
            <Plus />
            <span>{t("addCampaign")}</span>
          </Button>
        }
      />

      <EntityFormDialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setEditing(null);
        }}
        title={editing ? t("editCampaign") : t("newCampaign")}
        description={t("campaignDialogDescription")}
        form={form}
        onSubmit={(values) => saveMutation.mutate(values)}
        isPending={saveMutation.isPending}
        submitLabel={t("saveCampaign")}
        cancelLabel={t("actionCancel")}
      >
        <div className="space-y-4">
          <FormSection title="Campaign details">
            <FormField name="name" label={t("fieldName")}>
              {({ field, id }) => <Input {...field} id={id} placeholder={t("fieldName")} />}
            </FormField>
            <FormField name="code" label={t("fieldCode")}>
              {({ field, id }) => <Input {...field} id={id} placeholder={t("fieldCode")} />}
            </FormField>
            <FormField name="description" label={t("fieldDescription")} className="sm:col-span-2">
              {({ field, id }) => <Input {...field} id={id} placeholder={t("fieldDescription")} />}
            </FormField>
            <FormField name="channel" label={t("fieldChannel")}>
              {({ field, id }) => <Input {...field} id={id} placeholder={t("fieldChannel")} />}
            </FormField>
            <FormField name="status" label={t("fieldStatus")}>
              {({ field, id }) => <Input {...field} id={id} placeholder={t("fieldStatus")} />}
            </FormField>
          </FormSection>

          <FormSection title="Schedule & budget">
            <FormField name="startDate" label={t("fieldStartDate")}>
              {({ field }) => (
                <DatePicker
                  selected={field.value ? new Date(`${field.value}T00:00:00`) : undefined}
                  onSelect={(day) => field.onChange(day ? getLocalDateString(day) : "")}
                  defaultMonth={field.value ? new Date(`${field.value}T00:00:00`) : undefined}
                />
              )}
            </FormField>
            <FormField name="endDate" label={t("fieldEndDate")}>
              {({ field }) => (
                <DatePicker
                  selected={field.value ? new Date(`${field.value}T00:00:00`) : undefined}
                  onSelect={(day) => field.onChange(day ? getLocalDateString(day) : "")}
                  defaultMonth={field.value ? new Date(`${field.value}T00:00:00`) : undefined}
                />
              )}
            </FormField>
            <FormField name="budget" label={t("fieldBudget")}>
              {({ field, id }) => (
                <CurrencyField
                  id={id}
                  value={field.value === "" ? null : Number(field.value)}
                  onValueChange={(v) => field.onChange(String(v ?? 0))}
                  currency={orgCurrency}
                />
              )}
            </FormField>
          </FormSection>
        </div>
      </EntityFormDialog>
    </div>
  );
}
