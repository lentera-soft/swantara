"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
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
import type { Journal } from "@/lib/services/swantara";
import { getLocalDateString } from "@/lib/utils";

type AdvanceInvoiceDialogProps = {
  title: string;
  description?: string;
  confirmLabel: string;
  cancelLabel?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (values: { journalId: string; date: string; percentage: string }) => void;
  journals: Journal[];
};

export function AdvanceInvoiceDialog({
  title,
  description,
  confirmLabel,
  cancelLabel,
  open,
  onOpenChange,
  onConfirm,
  journals,
}: AdvanceInvoiceDialogProps) {
  const t = useTranslations("Sales");
  const tCommon = useTranslations("Common");
  const [journalId, setJournalId] = useState("");
  const [date, setDate] = useState(getLocalDateString());
  const [percentage, setPercentage] = useState("30");
  const percentageValue = Number(percentage);
  const invalidPercentage = !percentage || percentageValue <= 0 || percentageValue > 100;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-slot="advance-invoice-dialog" className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-sm">{tCommon("journal")}</span>
            <Select value={journalId} onValueChange={(v) => setJournalId(v ?? "")}>
              <SelectTrigger aria-label={tCommon("journal")}>
                <SelectValue placeholder={tCommon("selectJournal")} />
              </SelectTrigger>
              <SelectContent>
                {journals.map((j) => (
                  <SelectItem key={j.id} value={String(j.id)}>
                    {j.name} — {j.type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-sm">{t("advancePercent")}</span>
            <Input
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={percentage}
              onChange={(e) => setPercentage(e.target.value)}
            />
            <span className="text-xs text-muted-foreground">{t("advancePercentHint")}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-sm">{tCommon("date")}</span>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {cancelLabel ?? tCommon("cancel")}
          </Button>
          <Button
            onClick={() => onConfirm({ journalId, date, percentage })}
            disabled={!journalId || invalidPercentage}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
