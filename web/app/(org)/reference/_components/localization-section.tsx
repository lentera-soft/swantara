"use client";

import type { LegacyColumnDef as ColumnDef } from "@tanstack/react-table/legacy";
import { CheckCheck, PencilIcon, Plus, Settings2, Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { InteractiveEntityTable } from "@/app/(org)/_components/interactive-entity-table";
import { Badge } from "@/components/badge";
import { Button } from "@/components/button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useOrgListQuery } from "@/lib/hooks/use-org-query";
import type { LocalizationProfile } from "@/lib/services/swantara";
import { getSwantaraService } from "@/lib/services/swantara";
import { logger } from "@/lib/utils/client-logger";
import { LocalizationProfileFormDialog } from "./localization-profile-form-dialog";
import { LocalizationTaxTemplatesDialog } from "./localization-tax-templates-dialog";

export function LocalizationSection({ orgId }: { orgId: string }) {
  const t = useTranslations("Reference");
  const tCommon = useTranslations("Common");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<LocalizationProfile | null>(null);
  const [templateProfile, setTemplateProfile] = useState<LocalizationProfile | null>(null);

  const query = useOrgListQuery<
    { localizationProfiles: LocalizationProfile[] },
    Record<string, never>
  >("localizationProfiles", () => getSwantaraService().localizationProfiles.list());
  const profiles = query.data?.localizationProfiles ?? [];

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(profile: LocalizationProfile) {
    setEditing(profile);
    setFormOpen(true);
  }

  function handleSaved() {
    setFormOpen(false);
    void query.refetch();
  }

  function handleDelete(profile: LocalizationProfile) {
    void getSwantaraService()
      .localizationProfiles.delete(profile.id)
      .then(() => {
        toast.success(t("profileDeleted"));
        void query.refetch();
      })
      .catch((error) => {
        logger.error("Failed to delete localization profile", error);
        toast.error(t("toastFailed"));
      });
  }

  function handleApply(profile: LocalizationProfile) {
    void getSwantaraService()
      .localizationProfiles.apply(Number(orgId), profile.id)
      .then(() => {
        toast.success(t("profileApplied"));
        void query.refetch();
      })
      .catch((error) => {
        logger.error("Failed to apply localization profile", error);
        toast.error(t("toastFailed"));
      });
  }

  const columns: ColumnDef<LocalizationProfile>[] = [
    {
      accessorKey: "name",
      header: t("tableName"),
      cell: ({ row }) => <span>{row.original.name}</span>,
    },
    {
      accessorKey: "countryCode",
      header: t("tableCountry"),
      cell: ({ row }) => <Badge variant="secondary">{row.original.countryCode}</Badge>,
    },
    {
      accessorKey: "currencyCode",
      header: t("tableCurrency"),
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.currencyCode}</span>,
    },
    {
      accessorKey: "locale",
      header: t("tableLocale"),
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.locale}</span>,
    },
    {
      accessorKey: "timezone",
      header: t("tableTimezone"),
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.timezone}</span>,
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => openEdit(row.original)}
            aria-label={t("actionEdit")}
          >
            <PencilIcon />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setTemplateProfile(row.original)}
            aria-label={t("manageTaxTemplates")}
          >
            <Settings2 />
          </Button>
          <ConfirmDialog
            title={t("applyProfileTitle")}
            description={t("applyProfileDescription")}
            confirmLabel={t("applyProfile")}
            variant="neutral"
            onConfirm={() => handleApply(row.original)}
            trigger={
              <Button variant="ghost" size="icon-sm" aria-label={t("applyProfile")}>
                <CheckCheck />
              </Button>
            }
          />
          <ConfirmDialog
            title={t("deleteProfileTitle")}
            description={t("deleteProfileDescription")}
            confirmLabel={tCommon("delete")}
            onConfirm={() => handleDelete(row.original)}
            trigger={
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={t("actionDelete")}
                className="text-destructive"
              >
                <Trash2Icon />
              </Button>
            }
          />
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <InteractiveEntityTable
        columns={columns}
        data={profiles}
        getRowId={(row) => String(row.id)}
        searchKeys={["name", "countryCode", "currencyCode"]}
        searchPlaceholder={t("searchLocalizationPlaceholder")}
        filterLabel=""
        statusOptions={[]}
        allLabel=""
        ariaLabel={t("localizationProfilesTitle")}
        emptyTitle={t("localizationProfilesEmpty")}
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
            <span>{t("newLocalizationProfile")}</span>
          </Button>
        }
      />

      <LocalizationProfileFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        initial={editing}
        onSave={handleSaved}
      />

      {templateProfile ? (
        <LocalizationTaxTemplatesDialog
          open
          onOpenChange={(open) => {
            if (!open) setTemplateProfile(null);
          }}
          profile={templateProfile}
          onSaved={() => void query.refetch()}
        />
      ) : null}
    </div>
  );
}
