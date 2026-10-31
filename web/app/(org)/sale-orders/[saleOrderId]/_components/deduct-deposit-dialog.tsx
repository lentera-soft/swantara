"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
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
import type { InvoiceSummary } from "@/lib/services/swantara";
import { formatNumber } from "@/lib/utils";

type DeductDepositDialogProps = {
  title: string;
  description?: string;
  confirmLabel: string;
  cancelLabel?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (values: { advanceInvoiceId: string; finalInvoiceId: string; amount: string }) => void;
  invoices: InvoiceSummary[];
};

export function DeductDepositDialog({
  title,
  description,
  confirmLabel,
  cancelLabel,
  open,
  onOpenChange,
  onConfirm,
  invoices,
}: DeductDepositDialogProps) {
  const t = useTranslations("Sales");
  const tCommon = useTranslations("Common");
  const [advanceInvoiceId, setAdvanceInvoiceId] = useState("");
  const [finalInvoiceId, setFinalInvoiceId] = useState("");
  const [amount, setAmount] = useState("");

  const advanceInvoices = useMemo(
    () => invoices.filter((invoice) => invoice.isAdvance),
    [invoices],
  );
  const finalInvoices = useMemo(() => invoices.filter((invoice) => !invoice.isAdvance), [invoices]);
  const advance = useMemo(
    () => advanceInvoices.find((invoice) => String(invoice.id) === advanceInvoiceId) ?? null,
    [advanceInvoiceId, advanceInvoices],
  );
  const final = useMemo(
    () => finalInvoices.find((invoice) => String(invoice.id) === finalInvoiceId) ?? null,
    [finalInvoiceId, finalInvoices],
  );
  const suggestedAmount = useMemo(() => {
    if (!advance || !final) return "";
    const value = Math.min(advance.amountResidual, final.amountResidual);
    return value > 0 ? value.toFixed(2) : "";
  }, [advance, final]);
  const amountValue = Number(amount || suggestedAmount);
  const invalidAmount = !Number.isFinite(amountValue) || amountValue <= 0;
  const invalidSelection =
    !advanceInvoiceId || !finalInvoiceId || advanceInvoiceId === finalInvoiceId;

  function invoiceLabel(invoice: InvoiceSummary) {
    return `${invoice.name ?? `INV-${invoice.id}`} — ${formatNumber(invoice.amountResidual)}`;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-slot="deduct-deposit-dialog" className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-sm">{t("depositAdvanceInvoice")}</span>
            <Select
              value={advanceInvoiceId}
              onValueChange={(value) => {
                setAdvanceInvoiceId(value ?? "");
                setAmount("");
              }}
            >
              <SelectTrigger aria-label={t("depositAdvanceInvoice")}>
                <SelectValue placeholder={t("depositSelectInvoice")} />
              </SelectTrigger>
              <SelectContent>
                {advanceInvoices.map((invoice) => (
                  <SelectItem key={invoice.id} value={String(invoice.id)}>
                    {invoiceLabel(invoice)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-sm">{t("depositFinalInvoice")}</span>
            <Select
              value={finalInvoiceId}
              onValueChange={(value) => {
                setFinalInvoiceId(value ?? "");
                setAmount("");
              }}
            >
              <SelectTrigger aria-label={t("depositFinalInvoice")}>
                <SelectValue placeholder={t("depositSelectInvoice")} />
              </SelectTrigger>
              <SelectContent>
                {finalInvoices.map((invoice) => (
                  <SelectItem key={invoice.id} value={String(invoice.id)}>
                    {invoiceLabel(invoice)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-sm">{tCommon("amount")}</span>
            <Input
              type="number"
              min="0"
              step="any"
              value={amount}
              placeholder={suggestedAmount}
              onChange={(event) => setAmount(event.target.value)}
            />
            <span className="text-xs text-muted-foreground">{t("depositAmountHint")}</span>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {cancelLabel ?? tCommon("cancel")}
          </Button>
          <Button
            onClick={() =>
              onConfirm({
                advanceInvoiceId,
                finalInvoiceId,
                amount: amount || suggestedAmount,
              })
            }
            disabled={invalidSelection || invalidAmount}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
