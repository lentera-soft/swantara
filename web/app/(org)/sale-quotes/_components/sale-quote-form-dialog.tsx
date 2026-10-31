"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import {
  createEmptyLine,
  type LineRow,
  SaleOrderLinesEditor,
} from "@/app/(org)/sale-orders/_components/sale-order-lines-editor";
import { EntityFormDialog } from "@/components/entity-form-dialog";
import { FormField } from "@/components/form";
import { Input } from "@/components/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/select";
import { Textarea } from "@/components/textarea";
import { useLineResetEffect } from "@/lib/hooks/use-line-reset-effect";
import { useOrgListQuery, useOrgQuery } from "@/lib/hooks/use-org-query";
import type {
  Contact,
  CrmLead,
  Item,
  ItemVariant,
  PaymentTerm,
  PriceBook,
  SaleQuote,
} from "@/lib/services/swantara";
import { getSwantaraService } from "@/lib/services/swantara";
import { createId, getLocalDateString } from "@/lib/utils";

const NO_OPPORTUNITY = "none";

function useSaleQuoteFormSchema() {
  const t = useTranslations("Sales");
  return z.object({
    contactId: z.string().min(1, t("validationCustomerRequired")),
    priceBookId: z.string().min(1, t("validationPriceBookRequired")),
    prospectId: z.string(),
    quoteDate: z.string(),
    validityDate: z.string(),
    paymentTermId: z.string(),
    note: z.string(),
  });
}

type SaleQuoteFormValues = z.infer<ReturnType<typeof useSaleQuoteFormSchema>>;

type SaleQuoteFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  initialOpportunityId?: string | null;
  initialQuoteId?: string | null;
  onSave: (quoteId: string) => void;
};

export function SaleQuoteFormDialog({
  open,
  onOpenChange,
  orgId,
  initialOpportunityId,
  initialQuoteId,
  onSave,
}: SaleQuoteFormDialogProps) {
  const t = useTranslations("Sales");
  const tCommon = useTranslations("Common");
  const numericOrgId = Number(orgId);

  const contactsQuery = useOrgListQuery<{ contacts: Contact[] }, Record<string, never>>(
    "contacts",
    (organizationId) => getSwantaraService().contacts.list(organizationId),
  );
  const priceBooksQuery = useOrgListQuery<{ priceBooks: PriceBook[] }, Record<string, never>>(
    "price_books",
    (organizationId) => getSwantaraService().priceBooks.list(organizationId),
  );
  const opportunitiesQuery = useOrgListQuery<{ opportunities: CrmLead[] }, Record<string, never>>(
    "crmOpportunities",
    (organizationId) => getSwantaraService().crmOpportunities.list(organizationId),
  );
  const productsQuery = useOrgListQuery<{ products: Item[] }, Record<string, never>>(
    "products",
    (organizationId) => getSwantaraService().products.list(organizationId),
  );
  const paymentTermsQuery = useOrgListQuery<{ paymentTerms: PaymentTerm[] }, Record<string, never>>(
    "paymentTerms",
    () => getSwantaraService().paymentTerms.list({ size: 100 }),
  );
  const editQuery = useOrgQuery<{ quote: SaleQuote }>(
    "saleQuoteForEdit",
    initialQuoteId ?? "",
    (organizationId) => getSwantaraService().saleQuotes.get(organizationId, Number(initialQuoteId)),
    { enabled: Boolean(initialQuoteId) },
  );

  const contacts = contactsQuery.data?.contacts ?? [];
  const priceBooks = useMemo(() => priceBooksQuery.data?.priceBooks ?? [], [priceBooksQuery.data]);
  const opportunities = useMemo(
    () => opportunitiesQuery.data?.opportunities ?? [],
    [opportunitiesQuery.data],
  );
  const products = productsQuery.data?.products ?? [];
  const paymentTerms = paymentTermsQuery.data?.paymentTerms ?? [];
  const editingQuote = initialQuoteId ? (editQuery.data?.quote ?? null) : null;
  const isEdit = Boolean(editingQuote);
  const initialOpportunity = useMemo(
    () =>
      initialOpportunityId
        ? opportunities.find((opportunity) => String(opportunity.id) === initialOpportunityId)
        : undefined,
    [opportunities, initialOpportunityId],
  );

  const [lines, setLines] = useState<LineRow[]>([createEmptyLine()]);
  const [variantsByProduct, setVariantsByProduct] = useState<Record<string, ItemVariant[]>>({});

  useLineResetEffect(open, setLines, createEmptyLine);

  const form = useForm<SaleQuoteFormValues>({
    resolver: zodResolver(useSaleQuoteFormSchema()),
    defaultValues: {
      contactId: "",
      priceBookId: "",
      prospectId: NO_OPPORTUNITY,
      quoteDate: getLocalDateString(),
      validityDate: "",
      paymentTermId: "",
      note: "",
    },
  });

  useEffect(() => {
    if (!open) return;
    if (initialQuoteId && !editingQuote) return;
    if (editingQuote) {
      form.reset({
        contactId: String(editingQuote.contactId),
        priceBookId: editingQuote.priceBookId ? String(editingQuote.priceBookId) : "",
        prospectId: editingQuote.prospectId ? String(editingQuote.prospectId) : NO_OPPORTUNITY,
        quoteDate: editingQuote.quoteDate ? String(editingQuote.quoteDate).slice(0, 10) : "",
        validityDate: editingQuote.validityDate
          ? String(editingQuote.validityDate).slice(0, 10)
          : "",
        paymentTermId: editingQuote.paymentTermId ? String(editingQuote.paymentTermId) : "",
        note: editingQuote.note ?? "",
      });
      setLines(
        (editingQuote.lines ?? []).map((line) => ({
          id: createId(),
          itemId: line.itemId ? String(line.itemId) : "",
          qtyOrdered: String(line.qty),
          discountPct: String(line.discountPct),
          description: line.description ?? "",
        })),
      );
      return;
    }
    form.reset({
      contactId: initialOpportunity?.contactId ? String(initialOpportunity.contactId) : "",
      priceBookId: priceBooks[0] ? String(priceBooks[0].id) : "",
      prospectId: initialOpportunity ? String(initialOpportunity.id) : NO_OPPORTUNITY,
      quoteDate: getLocalDateString(),
      validityDate: initialOpportunity?.expectedClose
        ? String(initialOpportunity.expectedClose).slice(0, 10)
        : "",
      paymentTermId: "",
      note: "",
    });
  }, [open, form, priceBooks, initialOpportunity, initialQuoteId, editingQuote]);

  function selectOpportunity(opportunityId: string) {
    form.setValue("prospectId", opportunityId);
    const opportunity = opportunities.find((item) => String(item.id) === opportunityId);
    if (!opportunity) return;
    if (opportunity.contactId) {
      form.setValue("contactId", String(opportunity.contactId));
    }
    if (opportunity.expectedClose) {
      form.setValue("validityDate", String(opportunity.expectedClose).slice(0, 10));
    }
  }

  function loadVariants(itemId: string) {
    if (variantsByProduct[itemId]) return;
    void getSwantaraService()
      .products.variants.list(numericOrgId, Number(itemId))
      .then((data) => setVariantsByProduct((prev) => ({ ...prev, [itemId]: data.variants })))
      .catch(() => setVariantsByProduct((prev) => ({ ...prev, [itemId]: [] })));
  }

  function handleSubmit(values: SaleQuoteFormValues) {
    if (lines.length === 0) {
      toast.error(t("addAtLeastOneLine"));
      return;
    }
    if (lines.some((line) => !line.itemId || Number(line.qtyOrdered) <= 0)) {
      toast.error(t("quantityMustBePositive"));
      return;
    }
    const request = {
      organizationId: numericOrgId,
      contactId: Number(values.contactId),
      priceBookId: Number(values.priceBookId),
      salespersonId: editingQuote?.salespersonId ?? null,
      salesGroupId: editingQuote?.salesGroupId ?? null,
      prospectId:
        values.prospectId && values.prospectId !== NO_OPPORTUNITY
          ? Number(values.prospectId)
          : null,
      quoteDate: values.quoteDate || null,
      validityDate: values.validityDate || null,
      paymentTermId: values.paymentTermId ? Number(values.paymentTermId) : null,
      incoterm: editingQuote?.incoterm ?? null,
      customerPoRef: editingQuote?.customerPoRef ?? null,
      note: values.note || null,
      lines: lines.map((line, index) => ({
        sequence: (index + 1) * 10,
        itemId: Number(line.itemId),
        description: line.description || null,
        qty: Number(line.qtyOrdered),
        unitId: null,
        unitPrice: 0,
        discountPct: Number(line.discountPct) || 0,
        taxIds: [],
        dimensionId: null,
      })),
    };
    const save = editingQuote
      ? getSwantaraService().saleQuotes.update(numericOrgId, editingQuote.id, request)
      : getSwantaraService().saleQuotes.create(numericOrgId, request);
    return save
      .then(({ quote }) => {
        toast.success(isEdit ? t("quoteUpdated") : t("quoteCreated"));
        onSave(String(quote.id));
      })
      .catch(() => void toast.error(isEdit ? t("quoteUpdateFailed") : t("quoteCreateFailed")));
  }

  return (
    <EntityFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? t("editQuote") : t("newQuote")}
      description={isEdit ? t("editQuoteDescription") : t("newQuoteDescription")}
      form={form}
      onSubmit={handleSubmit}
      submitLabel={tCommon("save")}
      cancelLabel={tCommon("cancel")}
      className="max-h-[85vh] overflow-y-auto sm:max-w-3xl"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField name="contactId" label={t("tableCustomer")}>
          {({ field, id }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id={id} aria-label={t("tableCustomer")}>
                <SelectValue placeholder={t("selectCustomer")} />
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
        <FormField name="priceBookId" label={t("fieldPriceBook")}>
          {({ field, id }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id={id} aria-label={t("fieldPriceBook")}>
                <SelectValue placeholder={t("selectPriceBook")} />
              </SelectTrigger>
              <SelectContent>
                {priceBooks.map((priceBook) => (
                  <SelectItem key={priceBook.id} value={String(priceBook.id)}>
                    {priceBook.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </FormField>
        <FormField name="prospectId" label={t("fieldOpportunity")}>
          {({ field, id }) => (
            <Select value={field.value} onValueChange={selectOpportunity}>
              <SelectTrigger id={id} aria-label={t("fieldOpportunity")}>
                <SelectValue placeholder={t("selectOpportunity")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_OPPORTUNITY}>{t("noOpportunity")}</SelectItem>
                {opportunities.map((opportunity) => (
                  <SelectItem key={opportunity.id} value={String(opportunity.id)}>
                    {opportunity.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </FormField>
        <FormField name="quoteDate" label={t("tableQuoteDate")}>
          {({ field, id }) => <Input {...field} id={id} type="date" />}
        </FormField>
        <FormField name="validityDate" label={t("fieldValidityDate")}>
          {({ field, id }) => <Input {...field} id={id} type="date" />}
        </FormField>
        <FormField name="paymentTermId" label={t("fieldPaymentTerm")}>
          {({ field, id }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id={id} aria-label={t("fieldPaymentTerm")}>
                <SelectValue placeholder={t("selectPaymentTerm")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">{t("noPaymentTerm")}</SelectItem>
                {paymentTerms.map((term) => (
                  <SelectItem key={term.id} value={String(term.id)}>
                    {term.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </FormField>
        <FormField name="note" label={t("fieldNote")}>
          {({ field, id }) => <Textarea {...field} id={id} rows={2} />}
        </FormField>
      </div>
      <SaleOrderLinesEditor
        lines={lines}
        products={products}
        variantsByProduct={variantsByProduct}
        priceBookId={form.watch("priceBookId")}
        orderDate={form.watch("quoteDate")}
        onAdd={() => setLines((prev) => [...prev, createEmptyLine()])}
        onUpdate={(id, patch) =>
          setLines((prev) => prev.map((line) => (line.id === id ? { ...line, ...patch } : line)))
        }
        onRemove={(id) => setLines((prev) => prev.filter((line) => line.id !== id))}
        onSelectItem={loadVariants}
      />
    </EntityFormDialog>
  );
}
