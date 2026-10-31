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
import { EntityFormDialog } from "@/components/entity-form-dialog";
import { FormField } from "@/components/form";
import { Input } from "@/components/input";
import { useOrgListQuery } from "@/lib/hooks/use-org-query";
import type { Carrier } from "@/lib/services/swantara";
import { getSwantaraService } from "@/lib/services/swantara";
import { logger } from "@/lib/utils/client-logger";

function useCarrierSchema() {
  const t = useTranslations("Reference");
  return z.object({
    name: z.string().min(1, t("validationNameRequired")),
    trackingUrlTpl: z.string(),
  });
}

type CarrierValues = z.infer<ReturnType<typeof useCarrierSchema>>;

export function CarriersSection({ orgId }: { orgId: string }) {
  const t = useTranslations("Reference");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Carrier | null>(null);

  const query = useOrgListQuery<{ carriers: Carrier[] }, Record<string, never>>(
    "carriers",
    (organizationId) => getSwantaraService().carriers.list(organizationId),
  );

  const schema = useCarrierSchema();
  const form = useForm<CarrierValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", trackingUrlTpl: "" },
  });

  const carriers = query.data?.carriers ?? [];

  const saveMutation = useMutation({
    mutationFn: (values: CarrierValues) => {
      const payload = {
        name: values.name,
        trackingUrlTpl: values.trackingUrlTpl || null,
      };
      if (editing) {
        return getSwantaraService().carriers.update(Number(orgId), editing.id, payload);
      }
      return getSwantaraService().carriers.create(Number(orgId), payload);
    },
    onSuccess: () => {
      toast.success(t("carrierSaved"));
      setOpen(false);
      setEditing(null);
      form.reset();
      void query.refetch();
    },
    onError: (error) => {
      logger.error({ err: error }, "Failed to save carrier");
      toast.error(t("toastFailed"));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => getSwantaraService().carriers.delete(Number(orgId), id),
    onSuccess: () => {
      toast.success(t("carrierDeleted"));
      void query.refetch();
    },
    onError: (error) => {
      logger.error({ err: error }, "Failed to delete carrier");
      toast.error(t("toastFailed"));
    },
  });

  function openCreate() {
    setEditing(null);
    form.reset({ name: "", trackingUrlTpl: "" });
    setOpen(true);
  }

  function openEdit(carrier: Carrier) {
    setEditing(carrier);
    form.reset({ name: carrier.name, trackingUrlTpl: carrier.trackingUrlTpl ?? "" });
    setOpen(true);
  }

  const columns: ColumnDef<Carrier>[] = [
    {
      accessorKey: "name",
      header: t("tableName"),
      cell: ({ row }) => <span className="">{row.original.name}</span>,
    },
    {
      accessorKey: "trackingUrlTpl",
      header: t("tableTrackingUrl"),
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">
          {row.original.trackingUrlTpl || "—"}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <RowActions
          editLabel={t("actionEdit")}
          deleteLabel={t("actionDelete")}
          confirmTitle={t("deleteCarrierTitle")}
          confirmDescription={t("deleteCarrierDescription")}
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
        data={carriers}
        getRowId={(row) => String(row.id)}
        searchKeys={["name", "trackingUrlTpl"]}
        searchPlaceholder={t("searchCarriersPlaceholder")}
        filterLabel=""
        statusOptions={[]}
        allLabel=""
        ariaLabel={t("carriersTitle")}
        emptyTitle={t("carriersEmpty")}
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
            <span>{t("addCarrier")}</span>
          </Button>
        }
      />

      <EntityFormDialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setEditing(null);
        }}
        title={editing ? t("editCarrier") : t("newCarrier")}
        description={t("carrierDialogDescription")}
        form={form}
        onSubmit={(values) => saveMutation.mutate(values)}
        isPending={saveMutation.isPending}
        submitLabel={t("saveCarrier")}
        cancelLabel={t("actionCancel")}
      >
        <div className="flex flex-col gap-4">
          <FormField name="name" label={t("fieldName")}>
            {({ field, id }) => <Input {...field} id={id} placeholder={t("fieldName")} />}
          </FormField>
          <FormField name="trackingUrlTpl" label={t("fieldTrackingUrl")}>
            {({ field, id }) => (
              <Input
                {...field}
                id={id}
                placeholder={t("trackingUrlPlaceholder")}
                className="font-mono"
              />
            )}
          </FormField>
        </div>
      </EntityFormDialog>
    </div>
  );
}
