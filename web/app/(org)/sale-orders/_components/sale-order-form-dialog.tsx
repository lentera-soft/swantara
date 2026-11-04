"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Checkbox } from "@/components/checkbox";
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
  SaleOrder,
  SaleQuote,
  Warehouse,
} from "@/lib/services/swantara";
import { getSwantaraService } from "@/lib/services/swantara";
import { createId, getLocalDateString } from "@/lib/utils";
import { createEmptyLine, type LineRow, SaleOrderLinesEditor } from "./sale-order-lines-editor";

const NO_OPPORTUNITY = "none";

function useSaleOrderFormSchema() {
  const t = useTranslations("Sales");
  return z.object({
    contactId: z.string().min(1, t("validationCustomerRequired")),
    priceBookId: z.string().min(1, t("validationPriceBookRequired")),
    warehouseId: z.string().min(1, t("validationWarehouseRequired")),
    prospectId: z.string(),
    orderDate: z.string(),
    validityDate: z.string(),
    paymentTermId: z.string(),
    note: z.string(),
    allowMultipleOrders: z.boolean(),
  });
}

type SaleOrderFormValues = z.infer<ReturnType<typeof useSaleOrderFormSchema>>;

type SaleOrderFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  initialOpportunityId?: string | null;
  initialQuoteId?: string | null;
  initialOrderId?: string | null;
  onSave: (saleOrderId: string) => void;
};

export function SaleOrderFormDialog({
  open,
  onOpenChange,
  orgId,
  initialOpportunityId,
  initialQuoteId,
  initialOrderId,
  onSave,
}: SaleOrderFormDialogProps) {
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
  const warehousesQuery = useOrgListQuery<{ warehouses: Warehouse[] }, Record<string, never>>(
    "warehouses",
    (organizationId) => getSwantaraService().inventory.warehouses(organizationId),
  );
  const opportunitiesQuery = useOrgListQuery<{ opportunities: CrmLead[] }, Record<string, never>>(
    "crmOpportunities",
    (organizationId) => getSwantaraService().crmOpportunities.list(organizationId),
  );
  const productsQuery = useOrgListQuery<{ products: Item[] }, Record<string, never>>(
    "products",
    (organizationId) => getSwantaraService().products.list(organizationId),
  );
  const quoteQuery = useOrgQuery<{ quote: SaleQuote }>(
    "saleQuoteForOrder",
    initialQuoteId ?? "",
    (organizationId) => getSwantaraService().saleQuotes.get(organizationId, Number(initialQuoteId)),
    { enabled: Boolean(initialQuoteId) },
  );
  const paymentTermsQuery = useOrgListQuery<{ paymentTerms: PaymentTerm[] }, Record<string, never>>(
    "paymentTerms",
    (orgId) => getSwantaraService().paymentTerms.list(orgId, { size: 100 }),
  );
  const editQuery = useOrgQuery<{ order: SaleOrder }>(
    "saleOrderForEdit",
    initialOrderId ?? "",
    (organizationId) => getSwantaraService().saleOrders.get(organizationId, Number(initialOrderId)),
    { enabled: Boolean(initialOrderId) },
  );
  const sourceQuote = initialQuoteId ? (quoteQuery.data?.quote ?? null) : null;
  const editingOrder = initialOrderId ? (editQuery.data?.order ?? null) : null;
  const isEdit = Boolean(editingOrder);

  const contacts = contactsQuery.data?.contacts ?? [];
  const priceBooks = useMemo(() => priceBooksQuery.data?.priceBooks ?? [], [priceBooksQuery.data]);
  const warehouses = useMemo(() => warehousesQuery.data?.warehouses ?? [], [warehousesQuery.data]);
  const opportunities = useMemo(
    () =>
      (opportunitiesQuery.data?.opportunities ?? []).filter(
        (opportunity) =>
          opportunity.isWon ||
          (sourceQuote?.prospectId != null && opportunity.id === sourceQuote.prospectId),
      ),
    [opportunitiesQuery.data, sourceQuote],
  );
  const products = productsQuery.data?.products ?? [];
  const paymentTerms = paymentTermsQuery.data?.paymentTerms ?? [];

  const [lines, setLines] = useState<LineRow[]>([createEmptyLine()]);
  const [variantsByProduct, setVariantsByProduct] = useState<Record<string, ItemVariant[]>>({});

  useLineResetEffect(open, setLines, createEmptyLine);

  const form = useForm<SaleOrderFormValues>({
    resolver: zodResolver(useSaleOrderFormSchema()),
    defaultValues: {
      contactId: "",
      priceBookId: "",
      warehouseId: "",
      prospectId: initialOpportunityId || NO_OPPORTUNITY,
      orderDate: getLocalDateString(),
      validityDate: "",
      paymentTermId: "",
      note: "",
      allowMultipleOrders: false,
    },
  });

  const selectedProspectId = form.watch("prospectId");

  useEffect(() => {
    if (!open) return;
    if (initialOrderId && !editingOrder) return;
    if (editingOrder) {
      form.reset({
        contactId: String(editingOrder.contactId),
        priceBookId: editingOrder.priceBookId ? String(editingOrder.priceBookId) : "",
        warehouseId: editingOrder.warehouseId ? String(editingOrder.warehouseId) : "",
        prospectId: editingOrder.prospectId ? String(editingOrder.prospectId) : NO_OPPORTUNITY,
        orderDate: editingOrder.orderDate ? String(editingOrder.orderDate).slice(0, 10) : "",
        validityDate: editingOrder.validityDate
          ? String(editingOrder.validityDate).slice(0, 10)
          : "",
        paymentTermId: editingOrder.paymentTermId ? String(editingOrder.paymentTermId) : "",
        note: editingOrder.note ?? "",
        allowMultipleOrders: false,
      });
      setLines(
        (editingOrder.lines ?? []).map((line) => ({
          id: createId(),
          itemId: line.itemId ? String(line.itemId) : "",
          qtyOrdered: String(line.qtyOrdered),
          discountPct: String(line.discountPct),
          description: line.description ?? "",
        })),
      );
      return;
    }
    form.reset({
      contactId: "",
      priceBookId: priceBooks[0] ? String(priceBooks[0].id) : "",
      warehouseId: warehouses[0] ? String(warehouses[0].id) : "",
      prospectId: initialOpportunityId || NO_OPPORTUNITY,
      orderDate: getLocalDateString(),
      validityDate: "",
      paymentTermId: "",
      note: "",
      allowMultipleOrders: false,
    });
  }, [open, form, priceBooks, warehouses, initialOpportunityId, initialOrderId, editingOrder]);

  useEffect(() => {
    if (!open || !sourceQuote || editingOrder) return;
    form.reset({
      contactId: String(sourceQuote.contactId),
      priceBookId: sourceQuote.priceBookId ? String(sourceQuote.priceBookId) : "",
      warehouseId: warehouses[0] ? String(warehouses[0].id) : "",
      prospectId: sourceQuote.prospectId ? String(sourceQuote.prospectId) : NO_OPPORTUNITY,
      orderDate: getLocalDateString(),
      validityDate: sourceQuote.validityDate ? String(sourceQuote.validityDate).slice(0, 10) : "",
      paymentTermId: sourceQuote.paymentTermId ? String(sourceQuote.paymentTermId) : "",
      note: sourceQuote.note ?? "",
      allowMultipleOrders: false,
    });
  }, [open, form, sourceQuote, warehouses, editingOrder]);

  function loadVariants(itemId: string) {
    if (variantsByProduct[itemId]) return;
    void getSwantaraService()
      .products.variants.list(numericOrgId, Number(itemId))
      .then((data) => setVariantsByProduct((prev) => ({ ...prev, [itemId]: data.variants })))
      .catch(() => setVariantsByProduct((prev) => ({ ...prev, [itemId]: [] })));
  }

  function handleSubmit(values: SaleOrderFormValues) {
    if (!sourceQuote) {
      if (lines.length === 0) {
        toast.error(t("addAtLeastOneLine"));
        return;
      }
      if (lines.some((line) => !line.itemId || Number(line.qtyOrdered) <= 0)) {
        toast.error(t("quantityMustBePositive"));
        return;
      }
    }
    const request = {
      organizationId: numericOrgId,
      contactId: Number(values.contactId),
      priceBookId: Number(values.priceBookId),
      warehouseId: Number(values.warehouseId),
      prospectId:
        values.prospectId && values.prospectId !== NO_OPPORTUNITY
          ? Number(values.prospectId)
          : null,
      salespersonId: (editingOrder?.salespersonId ?? sourceQuote?.salespersonId ?? null) as
        | number
        | null,
      salesGroupId: (editingOrder?.salesGroupId ?? sourceQuote?.salesGroupId ?? null) as
        | number
        | null,
      shipAddressId: editingOrder?.shipAddressId ?? null,
      billAddressId: editingOrder?.billAddressId ?? null,
      orderDate: values.orderDate || null,
      expectedDate: editingOrder?.expectedDate
        ? String(editingOrder.expectedDate).slice(0, 10)
        : null,
      validityDate: values.validityDate || null,
      paymentTermId: values.paymentTermId ? Number(values.paymentTermId) : null,
      incoterm: editingOrder?.incoterm ?? null,
      customerPoRef: editingOrder?.customerPoRef ?? null,
      note: values.note || null,
      allowMultipleOrders: values.allowMultipleOrders,
      quoteId: editingOrder ? editingOrder.quoteId : sourceQuote ? sourceQuote.id : null,
      lines: sourceQuote
        ? []
        : lines.map((line, index) => ({
            sequence: (index + 1) * 10,
            itemId: Number(line.itemId),
            description: line.description || null,
            qtyOrdered: Number(line.qtyOrdered),
            unitId: null as number | null,
            discountPct: Number(line.discountPct) || 0,
            taxIds: [] as number[],
            dimensionId: null as number | null,
          })),
    };
    const save = editingOrder
      ? getSwantaraService().saleOrders.update(numericOrgId, editingOrder.id, request)
      : getSwantaraService().saleOrders.create(numericOrgId, request);
    return save
      .then(({ order }) => {
        toast.success(isEdit ? t("orderUpdated") : t("quotationCreated"));
        onSave(String(order.id));
      })
      .catch(() => void toast.error(isEdit ? t("orderUpdateFailed") : t("quotationCreateFailed")));
  }

  return (
    <EntityFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? t("editOrder") : t("newQuotation")}
      description={isEdit ? t("editOrderDescription") : t("newQuotationDescription")}
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
        <FormField name="warehouseId" label={t("fieldWarehouse")}>
          {({ field, id }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id={id} aria-label={t("fieldWarehouse")}>
                <SelectValue placeholder={t("selectWarehouse")} />
              </SelectTrigger>
              <SelectContent>
                {warehouses.map((warehouse) => (
                  <SelectItem key={warehouse.id} value={String(warehouse.id)}>
                    {warehouse.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </FormField>
        <FormField name="prospectId" label={t("fieldOpportunityWon")}>
          {({ field, id }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id={id} aria-label={t("fieldOpportunityWon")}>
                <SelectValue placeholder={t("selectOpportunity")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_OPPORTUNITY}>{t("noOpportunity")}</SelectItem>
                {opportunities.length === 0 ? (
                  <SelectItem value="no-won-opportunities" disabled>
                    {t("noWonOpportunities")}
                  </SelectItem>
                ) : (
                  opportunities.map((opportunity) => (
                    <SelectItem key={opportunity.id} value={String(opportunity.id)}>
                      {opportunity.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          )}
        </FormField>
        {!isEdit && selectedProspectId && selectedProspectId !== NO_OPPORTUNITY ? (
          <FormField
            name="allowMultipleOrders"
            label={t("fieldAllowMultipleOrders")}
            description={t("fieldAllowMultipleOrdersHint")}
            className="sm:col-span-2"
          >
            {({ field, id }) => (
              <Checkbox
                id={id}
                checked={field.value}
                onCheckedChange={(checked) => field.onChange(Boolean(checked))}
              />
            )}
          </FormField>
        ) : null}
        <FormField name="orderDate" label={t("tableOrderDate")}>
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
      {sourceQuote ? (
        <p className="mt-6 rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">
          {t("quoteLinesWillBeCopied")}
        </p>
      ) : (
        <SaleOrderLinesEditor
          lines={lines}
          products={products}
          variantsByProduct={variantsByProduct}
          priceBookId={form.watch("priceBookId")}
          orderDate={form.watch("orderDate")}
          onAdd={() => setLines((prev) => [...prev, createEmptyLine()])}
          onUpdate={(id, patch) =>
            setLines((prev) => prev.map((line) => (line.id === id ? { ...line, ...patch } : line)))
          }
          onRemove={(id) => setLines((prev) => prev.filter((line) => line.id !== id))}
          onSelectItem={loadVariants}
        />
      )}
    </EntityFormDialog>
  );
}
