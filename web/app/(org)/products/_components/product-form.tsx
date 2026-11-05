"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { AttachmentDropzone } from "@/components/attachment-dropzone";
import { Button } from "@/components/button";
import { CurrencyField } from "@/components/currency-field";
import { Form, FormField, SubmitButton } from "@/components/form";
import { FormSection } from "@/components/form-section";
import { Input } from "@/components/input";
import { PageHeader } from "@/components/page-header";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/select";
import { Switch } from "@/components/switch";
import { useActiveOrgCurrency } from "@/lib/hooks/use-org-context";
import { useOrgListQuery } from "@/lib/hooks/use-org-query";
import type { ItemCategory, Unit } from "@/lib/services/swantara";
import { getSwantaraService } from "@/lib/services/swantara";

import { AttributeEditor, type AttributeRow } from "./attribute-editor";
import {
  emptyProductTemplate,
  type ProductFormValues,
  type ProductInitial,
  toProductFormValues,
  useProductSchema,
} from "./product-form-schema";
import { productTypes, trackingModes } from "./products-data";
import { buildMatrix, generateSku, VariantMatrixPreview } from "./variant-matrix-preview";

type TFn = (key: string, values?: Record<string, string | number>) => string;

export function ProductForm({
  orgId,
  initial,
  cancelHref = "/products",
}: {
  orgId: string;
  initial?: ProductInitial;
  cancelHref?: string;
}) {
  const t = (useTranslations as unknown as (ns: string) => TFn)("Products");
  const tCommon = useTranslations("Common");
  const orgCurrency = useActiveOrgCurrency();
  const router = useRouter();
  const queryClient = useQueryClient();
  const schema = useProductSchema();

  const categoriesQuery = useOrgListQuery<{ categories: ItemCategory[] }, Record<string, never>>(
    "productCategories",
    (organizationId) => getSwantaraService().productCategories.list(organizationId),
  );
  const unitsQuery = useOrgListQuery<{ units: Unit[] }, Record<string, never>>(
    "units",
    (organizationId) => getSwantaraService().units.list(organizationId),
  );

  const categories = (categoriesQuery.data?.categories ?? []).map((category) => ({
    id: String(category.id),
    name: category.name,
  }));
  const uomOptions = (unitsQuery.data?.units ?? []).map((unit) => ({
    id: String(unit.id),
    name: unit.name,
  }));

  const [attributes, setAttributes] = useState<AttributeRow[]>([]);
  const [images, setImages] = useState<File[]>([]);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(schema),
    defaultValues: toProductFormValues(initial ?? emptyProductTemplate()),
  });

  const templateName = form.watch("name");
  const matrix = buildMatrix(attributes);
  const generatedSkus = matrix.map((combination) => generateSku(templateName || "", combination));
  const hasDuplicateSkus = new Set(generatedSkus).size !== generatedSkus.length;

  const createMutation = useMutation({
    mutationFn: async (values: ProductFormValues) => {
      const request = {
        organizationId: Number(orgId) || 0,
        name: values.name,
        categoryId: values.categoryId === "" ? null : Number(values.categoryId) || null,
        type: values.type,
        unitId: values.unitId === "" ? null : Number(values.unitId) || null,
        purchaseUnitId: values.purchaseUnitId === "" ? null : Number(values.purchaseUnitId) || null,
        listPrice: Number(values.listPrice) || 0,
        standardCost: Number(values.standardCost) || 0,
        isPurchasable: values.isPurchasable,
        isSellable: values.isSellable,
        isManufactured: values.isManufactured,
        tracking: values.tracking,
        weight: 0,
        volume: 0,
        hsCode: null,
        descriptionSale: null,
        descriptionPurchase: null,
        active: true,
        variants: matrix.map((combination) => ({
          sku: null,
          barcode: null,
          attributeJson: combination,
          extraCost: 0,
          active: true,
        })),
        attributeMatrix: [],
      };

      const created = await getSwantaraService().products.create(Number(orgId) || 0, request);

      let imageUploadsFailed = 0;
      for (const [index, image] of images.entries()) {
        try {
          await getSwantaraService().attachments.upload(Number(orgId) || 0, {
            ownerType: "product",
            ownerId: created.item.id,
            sortOrder: (index + 1) * 10,
            isPrimary: index === 0,
            file: image,
          });
        } catch {
          imageUploadsFailed += 1;
        }
      }
      return { item: created.item, imageUploadsFailed };
    },
    onSuccess: ({ item, imageUploadsFailed }) => {
      toast.success(t("toastItemSaved"));
      if (imageUploadsFailed > 0) {
        toast.error(t("imagesUploadPartial", { count: imageUploadsFailed }));
      }
      void queryClient.invalidateQueries({ queryKey: ["products"] });
      void queryClient.invalidateQueries({ queryKey: ["attachments", Number(orgId) || 0] });
      router.push(`/products/${item.id}`);
    },
    onError: () => {
      toast.error(t("toastFailed"));
    },
  });

  function handleSubmit(values: ProductFormValues) {
    if (hasDuplicateSkus) {
      toast.error(t("duplicateSkuError"));
      return;
    }
    createMutation.mutate(values);
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <PageHeader force title={t("newItem")} description={t("newItemDescription")} />
      <Form form={form} onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FormSection title={t("general")}>
          <FormField name="name" label={t("fieldName")} className="sm:col-span-2">
            {({ field, id }) => <Input {...field} id={id} placeholder={t("fieldName")} autoFocus />}
          </FormField>
          <FormField name="categoryId" label={t("fieldCategory")}>
            {({ field, id }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id={id} aria-label={t("fieldCategory")}>
                  <SelectValue placeholder={t("noCategory")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{t("noCategory")}</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </FormField>
          <FormField name="type" label={t("fieldType")}>
            {({ field, id }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id={id} aria-label={t("fieldType")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {productTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {(t as unknown as (k: string) => string)(`productType_${type}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </FormField>
          <FormField name="tracking" label={t("fieldTracking")}>
            {({ field, id }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id={id} aria-label={t("fieldTracking")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {trackingModes.map((mode) => (
                    <SelectItem key={mode} value={mode}>
                      {(t as unknown as (k: string) => string)(`trackingMode_${mode}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </FormField>
          <FormField name="unitId" label={t("fieldUnit")}>
            {({ field, id }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id={id} aria-label={t("fieldUnit")}>
                  <SelectValue placeholder={t("fieldUnit")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">—</SelectItem>
                  {uomOptions.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </FormField>
          <FormField name="purchaseUnitId" label={t("fieldPurchaseUnit")}>
            {({ field, id }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id={id} aria-label={t("fieldPurchaseUnit")}>
                  <SelectValue placeholder={t("fieldPurchaseUnit")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">—</SelectItem>
                  {uomOptions.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </FormField>
        </FormSection>

        <FormSection title={t("imagesSection")} description={t("imagesSectionDescription")}>
          <div className="col-span-full">
            <AttachmentDropzone
              accept="image/*"
              files={images}
              onChange={setImages}
              maxFiles={10}
              maxSizeBytes={10 * 1024 * 1024}
            />
          </div>
        </FormSection>

        <FormSection title={t("pricing")}>
          <FormField name="listPrice" label={t("colListPrice")}>
            {({ field, id }) => (
              <CurrencyField
                id={id}
                value={field.value === "" ? null : Number(field.value)}
                onValueChange={(value) => field.onChange(String(value ?? 0))}
                currency={orgCurrency}
              />
            )}
          </FormField>
          <FormField name="standardCost" label={t("colStandardCost")}>
            {({ field, id }) => (
              <CurrencyField
                id={id}
                value={field.value === "" ? null : Number(field.value)}
                onValueChange={(value) => field.onChange(String(value ?? 0))}
                currency={orgCurrency}
              />
            )}
          </FormField>
        </FormSection>

        <FormSection title={t("salesPurchase")}>
          <FormField name="isSellable" label={t("canBeSold")}>
            {({ field }) => (
              <Switch
                checked={field.value}
                onCheckedChange={(checked) => field.onChange(Boolean(checked))}
                aria-label={t("canBeSold")}
              />
            )}
          </FormField>
          <FormField name="isPurchasable" label={t("canBePurchased")}>
            {({ field }) => (
              <Switch
                checked={field.value}
                onCheckedChange={(checked) => field.onChange(Boolean(checked))}
                aria-label={t("canBePurchased")}
              />
            )}
          </FormField>
          <FormField name="isManufactured" label={t("isManufactured")}>
            {({ field }) => (
              <Switch
                checked={field.value}
                onCheckedChange={(checked) => field.onChange(Boolean(checked))}
                aria-label={t("isManufactured")}
              />
            )}
          </FormField>
        </FormSection>

        <FormSection
          title={t("attributesVariants")}
          description={t("attributesVariantsDescription")}
        >
          <div className="col-span-full flex flex-col gap-3">
            <AttributeEditor value={attributes} onChange={setAttributes} />
            <VariantMatrixPreview templateName={templateName || ""} attributes={attributes} />
          </div>
        </FormSection>

        <div className="flex items-center justify-end gap-2">
          <Button type="button" variant="outline" disabled={createMutation.isPending} asChild>
            <Link href={cancelHref}>{tCommon("cancel")}</Link>
          </Button>
          <SubmitButton loading={createMutation.isPending} disabled={createMutation.isPending}>
            {t("saveItem")}
          </SubmitButton>
        </div>
      </Form>
    </div>
  );
}
