"use client";

import { Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/dialog";
import { Input } from "@/components/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/select";
import { Switch } from "@/components/switch";
import { useOrgQuery } from "@/lib/hooks/use-org-query";
import type {
  LocalizationProfile,
  LocalizationTaxTemplateLineRequest,
} from "@/lib/services/swantara";
import { getSwantaraService } from "@/lib/services/swantara";

const TAX_KINDS = ["sale", "purchase"] as const;

type TemplateRow = LocalizationTaxTemplateLineRequest & { rowId: number };

let nextRowId = 0;

export function LocalizationTaxTemplatesDialog({
  open,
  onOpenChange,
  profile,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: LocalizationProfile;
  onSaved: () => void;
}) {
  const t = useTranslations("Reference");
  const tCommon = useTranslations("Common");
  const [rows, setRows] = useState<TemplateRow[]>([]);
  const [saving, setSaving] = useState(false);

  const query = useOrgQuery<{ taxTemplateLines: LocalizationTaxTemplateLineRequest[] }>(
    "localizationTaxTemplates",
    profile.id,
    () => getSwantaraService().localizationProfiles.taxTemplates(profile.id),
  );

  useEffect(() => {
    const lines = query.data?.taxTemplateLines ?? [];
    setRows(
      lines.map((line) => ({
        rowId: ++nextRowId,
        name: line.name,
        kind: line.kind,
        rate: line.rate,
        priceInclude: line.priceInclude,
        taxAccountCode: line.taxAccountCode,
        sequence: line.sequence,
      })),
    );
  }, [query.data]);

  function addRow() {
    setRows((prev) => [
      ...prev,
      {
        rowId: ++nextRowId,
        name: "",
        kind: "sale",
        rate: 0,
        priceInclude: false,
        taxAccountCode: "",
        sequence: prev.length + 1,
      },
    ]);
  }

  function removeRow(rowId: number) {
    setRows((prev) => prev.filter((row) => row.rowId !== rowId));
  }

  function updateRow(rowId: number, updates: Partial<TemplateRow>) {
    setRows((prev) => prev.map((row) => (row.rowId === rowId ? { ...row, ...updates } : row)));
  }

  function handleSave() {
    setSaving(true);
    void getSwantaraService()
      .localizationProfiles.replaceTaxTemplates(
        profile.id,
        rows.map((row) => ({
          name: row.name,
          kind: row.kind,
          rate: row.rate,
          priceInclude: row.priceInclude,
          taxAccountCode: row.taxAccountCode,
          sequence: row.sequence,
        })),
      )
      .then(() => {
        toast.success(t("taxTemplatesSaved"));
        onOpenChange(false);
        onSaved();
      })
      .catch(() => toast.error(t("toastFailed")))
      .finally(() => setSaving(false));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col overflow-hidden sm:max-w-2xl">
        <DialogHeader className="shrink-0">
          <DialogTitle>{t("taxTemplatesTitle")}</DialogTitle>
          <DialogDescription>{t("taxTemplatesDescription")}</DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto py-2">
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("taxTemplatesEmpty")}</p>
          ) : null}
          {rows.map((row) => (
            <div key={row.rowId} className="grid grid-cols-12 items-end gap-2">
              <div className="col-span-4 flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">{t("fieldName")}</span>
                <Input
                  value={row.name}
                  onChange={(event) => updateRow(row.rowId, { name: event.target.value })}
                  aria-label={t("fieldName")}
                />
              </div>
              <div className="col-span-3 flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">{t("fieldTaxKind")}</span>
                <Select
                  value={row.kind}
                  onValueChange={(value) =>
                    updateRow(row.rowId, { kind: value as TemplateRow["kind"] })
                  }
                >
                  <SelectTrigger aria-label={t("fieldTaxKind")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TAX_KINDS.map((kind) => (
                      <SelectItem key={kind} value={kind}>
                        {t(`taxKind_${kind}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">{t("fieldTaxRate")}</span>
                <Input
                  type="number"
                  step="any"
                  min="0"
                  value={row.rate}
                  onChange={(event) =>
                    updateRow(row.rowId, { rate: Number(event.target.value) || 0 })
                  }
                  aria-label={t("fieldTaxRate")}
                />
              </div>
              <div className="col-span-2 flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">{t("fieldTaxAccountCode")}</span>
                <Input
                  value={row.taxAccountCode}
                  onChange={(event) => updateRow(row.rowId, { taxAccountCode: event.target.value })}
                  aria-label={t("fieldTaxAccountCode")}
                />
              </div>
              <div className="col-span-1 flex justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="text-destructive"
                  onClick={() => removeRow(row.rowId)}
                  aria-label={t("removeLine")}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="col-span-12 flex items-center gap-2 pl-1">
                <Switch
                  checked={row.priceInclude}
                  onCheckedChange={(checked) =>
                    updateRow(row.rowId, { priceInclude: Boolean(checked) })
                  }
                  aria-label={t("fieldPriceInclude")}
                />
                <span className="text-xs text-muted-foreground">{t("fieldPriceInclude")}</span>
              </div>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" className="self-start" onClick={addRow}>
            <Plus className="mr-1 h-4 w-4" />
            {t("addLine")}
          </Button>
        </div>

        <DialogFooter className="shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            {tCommon("cancel")}
          </Button>
          <Button onClick={handleSave} disabled={saving} aria-busy={saving || undefined}>
            {tCommon("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
