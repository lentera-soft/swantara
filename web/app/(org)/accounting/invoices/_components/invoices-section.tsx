"use client";

import type { LegacyColumnDef as ColumnDef } from "@tanstack/react-table/legacy";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { InteractiveEntityTable } from "@/app/(org)/_components/interactive-entity-table";
import { Badge } from "@/components/badge";
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
import { useOrgListQuery } from "@/lib/hooks/use-org-query";
import type { Account, Contact, InvoiceSummary, Journal } from "@/lib/services/swantara";
import { getSwantaraService } from "@/lib/services/swantara";
import { formatDate, formatMoney, getLocalDateString } from "@/lib/utils";
import { type InvoiceState, invoiceStateTone } from "./invoice-utils";

type TFn = (key: string, values?: Record<string, string | number>) => string;

export function InvoicesSection({ orgId }: { orgId: string }) {
  const t = (useTranslations as unknown as (ns: string) => TFn)("Accounting");
  const [dialogOpen, setDialogOpen] = useState(false);

  const invoicesQuery = useOrgListQuery<{ invoices: InvoiceSummary[] }, Record<string, never>>(
    "invoices",
    (organizationId) => getSwantaraService().invoices.list(organizationId),
  );
  const journalsQuery = useOrgListQuery<{ journals: Journal[] }, Record<string, never>>(
    "journals",
    (organizationId) => getSwantaraService().journals.list(organizationId),
  );

  const invoices = invoicesQuery.data?.invoices ?? [];

  const columns: ColumnDef<InvoiceSummary>[] = [
    {
      accessorKey: "name",
      header: () => t("colNumber"),
      cell: ({ row }) => (
        <a
          href={`/accounting/invoices/${row.original.id}`}
          className=" rounded outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {row.original.name ?? `INV-${row.original.id}`}
        </a>
      ),
    },
    {
      accessorKey: "contactId",
      header: () => t("colContact"),
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">{`#${row.original.contactId}`}</span>
      ),
    },
    {
      accessorKey: "invoiceDate",
      header: () => t("colInvoiceDate"),
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">
          {row.original.invoiceDate ? formatDate(row.original.invoiceDate) : "—"}
        </span>
      ),
    },
    {
      accessorKey: "amountTotal",
      header: () => t("colTotal"),
      meta: { align: "right" },
      cell: ({ row }) => (
        <span className="tabular-nums ">{formatMoney(row.original.amountTotal)}</span>
      ),
    },
    {
      accessorKey: "amountResidual",
      header: () => t("colRemaining"),
      meta: { align: "right" },
      cell: ({ row }) => (
        <span className="tabular-nums">{formatMoney(row.original.amountResidual)}</span>
      ),
    },
    {
      accessorKey: "state",
      header: () => t("colStatus"),
      cell: ({ row }) => {
        const state = row.original.state as InvoiceState;
        return (
          <Badge variant="outline" className={invoiceStateTone(state)}>
            {(t as unknown as (k: string) => string)(`invoiceState_${state}`)}
          </Badge>
        );
      },
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <InteractiveEntityTable
        columns={columns}
        data={invoices}
        getRowId={(row) => String(row.id)}
        searchKeys={["name"]}
        statusKey="state"
        statusOptions={[
          { value: "draft", label: (t as unknown as (k: string) => string)("invoiceState_draft") },
          {
            value: "posted",
            label: (t as unknown as (k: string) => string)("invoiceState_posted"),
          },
          {
            value: "cancelled",
            label: (t as unknown as (k: string) => string)("invoiceState_cancelled"),
          },
        ]}
        searchPlaceholder={t("searchInvoices")}
        filterLabel={t("colStatus")}
        allLabel={t("filterAll")}
        ariaLabel={t("invoicesTitle")}
        emptyTitle={t("invoicesEmpty")}
        status={
          invoicesQuery.isLoading
            ? { type: "loading" }
            : invoicesQuery.isError
              ? {
                  type: "error",
                  message: invoicesQuery.error.message,
                  onRetry: () => void invoicesQuery.refetch(),
                }
              : undefined
        }
        actions={
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Plus />
            <span>{t("newInvoice")}</span>
          </Button>
        }
      />
      {dialogOpen ? (
        <InvoiceFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          orgId={orgId}
          journals={journalsQuery.data?.journals ?? []}
          onSave={() => {
            setDialogOpen(false);
            void invoicesQuery.refetch();
          }}
        />
      ) : null}
    </div>
  );
}

function InvoiceFormDialog({
  open,
  onOpenChange,
  orgId,
  journals,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  journals: Journal[];
  onSave: () => void;
}) {
  const [invoiceType, setInvoiceType] = useState<"customer_invoice" | "vendor_bill">(
    "customer_invoice",
  );
  const [contactId, setContactId] = useState("");
  const [journalId, setJournalId] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(getLocalDateString());
  const [reference, setReference] = useState("");
  const [lines, setLines] = useState<
    { id: string; description: string; qty: string; unitPrice: string; accountId: string }[]
  >([{ id: "1", description: "", qty: "1", unitPrice: "", accountId: "" }]);
  const t = (useTranslations as unknown as (ns: string) => TFn)("Accounting");
  const tCommon = useTranslations("Common");

  const accountsQuery = useOrgListQuery<{ accounts: Account[] }, Record<string, never>>(
    "accounts",
    (organizationId) => getSwantaraService().accounts.list(organizationId),
  );
  const contactsQuery = useOrgListQuery<{ contacts: Contact[] }, Record<string, never>>(
    "contacts",
    (organizationId) => getSwantaraService().contacts.list(organizationId),
  );

  const accounts = accountsQuery.data?.accounts ?? [];
  const contacts = contactsQuery.data?.contacts ?? [];

  useEffect(() => {
    if (!open) return;
    setInvoiceType("customer_invoice");
    setContactId("");
    setJournalId("");
    setInvoiceDate(getLocalDateString());
    setReference("");
    setLines([{ id: "1", description: "", qty: "1", unitPrice: "", accountId: "" }]);
  }, [open]);

  function addLine() {
    setLines((prev) => [
      ...prev,
      { id: String(Date.now()), description: "", qty: "1", unitPrice: "", accountId: "" },
    ]);
  }

  function updateLine(id: string, patch: Partial<(typeof lines)[number]>) {
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }

  function removeLine(id: string) {
    setLines((prev) => prev.filter((l) => l.id !== id));
  }

  const subtotal = lines.reduce((s, l) => s + (Number(l.qty) || 0) * (Number(l.unitPrice) || 0), 0);

  const filledLines = lines.filter((l) => l.description);
  const canSubmit =
    Boolean(contactId && journalId) &&
    filledLines.length > 0 &&
    filledLines.every((l) => l.accountId);

  function handleSubmit() {
    if (!canSubmit) return;
    const payload = {
      organizationId: Number(orgId) || 0,
      journalId: Number(journalId) || 0,
      contactId: Number(contactId) || 0,
      date: invoiceDate,
      dueDate: invoiceDate,
      reference,
      lines: filledLines.map((l) => ({
        itemId: null,
        description: l.description,
        qty: Number(l.qty) || 1,
        unitId: null,
        unitPrice: Number(l.unitPrice) || 0,
        discountPct: 0,
        taxIds: [],
        accountId: Number(l.accountId) || 0,
        dimensionId: null,
      })),
    };
    const request =
      invoiceType === "vendor_bill"
        ? getSwantaraService().vendorBills.create(Number(orgId) || 0, payload)
        : getSwantaraService().invoices.create(Number(orgId) || 0, payload);
    void request.then(() => {
      toast.success(t("toastInvoiceCreated"));
      onSave();
    });
  }

  const invoiceTypes = [
    {
      value: "customer_invoice",
      label: (t as unknown as (k: string) => string)("invoiceType_customer_invoice"),
    },
    {
      value: "vendor_bill",
      label: (t as unknown as (k: string) => string)("invoiceType_vendor_bill"),
    },
  ] as const;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t("createInvoice")}</DialogTitle>
          <DialogDescription>{t("createInvoiceDescription")}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <span className="text-sm">{t("fieldInvoiceType")}</span>
              <Select
                value={invoiceType}
                onValueChange={(v) => setInvoiceType(v as "customer_invoice" | "vendor_bill")}
              >
                <SelectTrigger aria-label={t("fieldInvoiceType")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {invoiceTypes.map((it) => (
                    <SelectItem key={it.value} value={it.value}>
                      {it.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm">{t("colContact")}</span>
              <Select value={contactId} onValueChange={(value) => setContactId(value ?? "")}>
                <SelectTrigger aria-label={t("colContact")}>
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
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-1">
              <span className="text-sm">{t("fieldJournal")}</span>
              <Select value={journalId} onValueChange={(v) => setJournalId(v ?? "")}>
                <SelectTrigger aria-label={t("fieldJournal")}>
                  <SelectValue placeholder={t("selectJournal")} />
                </SelectTrigger>
                <SelectContent>
                  {journals.map((j) => (
                    <SelectItem key={j.id} value={String(j.id)}>
                      {j.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm">{t("colInvoiceDate")}</span>
              <Input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm">{t("colReference")}</span>
              <Input value={reference} onChange={(e) => setReference(e.target.value)} />
            </div>
          </div>
          <div className="flex flex-col gap-3 rounded-md border p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm">{t("invoiceLines")}</h3>
              <Button type="button" variant="outline" size="sm" onClick={addLine}>
                {t("addLine")}
              </Button>
            </div>
            {lines.map((line) => (
              <div key={line.id} className="grid gap-2 rounded-md border p-3 sm:grid-cols-12">
                <div className="sm:col-span-4">
                  <span className="text-xs text-muted-foreground">{t("colDescription")}</span>
                  <Input
                    value={line.description}
                    onChange={(e) => updateLine(line.id, { description: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-1">
                  <span className="text-xs text-muted-foreground">{t("colQuantity")}</span>
                  <Input
                    value={line.qty}
                    onChange={(e) => updateLine(line.id, { qty: e.target.value })}
                    type="number"
                    min="0"
                    step="any"
                  />
                </div>
                <div className="sm:col-span-2">
                  <span className="text-xs text-muted-foreground">{t("colUnitPrice")}</span>
                  <Input
                    value={line.unitPrice}
                    onChange={(e) => updateLine(line.id, { unitPrice: e.target.value })}
                    type="number"
                    min="0"
                    step="any"
                  />
                </div>
                <div className="sm:col-span-3">
                  <span className="text-xs text-muted-foreground">{t("colAccount")}</span>
                  <Select
                    value={line.accountId}
                    onValueChange={(value) => updateLine(line.id, { accountId: value ?? "" })}
                  >
                    <SelectTrigger aria-label={t("colAccount")}>
                      <SelectValue placeholder={t("selectAccount")} />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map((account) => (
                        <SelectItem key={account.id} value={String(account.id)}>
                          {account.code} — {account.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="sm:col-span-2 flex items-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeLine(line.id)}
                  >
                    {tCommon("delete")}
                  </Button>
                </div>
              </div>
            ))}
            <div className="flex justify-end text-sm">
              <span>
                {t("subtotal")}: {formatMoney(subtotal)}
              </span>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {tCommon("cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {t("createAction")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
