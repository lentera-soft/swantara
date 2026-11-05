"use client";

import { useTranslations } from "next-intl";
import { z } from "zod";

import { productTypes, trackingModes } from "./products-data";

type TFn = (key: string, values?: Record<string, string | number>) => string;

export function useProductSchema() {
  const t = (useTranslations as unknown as (ns: string) => TFn)("Products");
  return z.object({
    name: z.string().trim().min(1, t("validationNameRequired")),
    categoryId: z.string().trim(),
    type: z.enum(productTypes),
    tracking: z.enum(trackingModes),
    unitId: z.string().trim(),
    purchaseUnitId: z.string().trim(),
    listPrice: z
      .string()
      .trim()
      .refine((value) => Number(value) >= 0, t("validationNonNegative")),
    standardCost: z
      .string()
      .trim()
      .refine((value) => Number(value) >= 0, t("validationNonNegative")),
    isPurchasable: z.boolean(),
    isSellable: z.boolean(),
    isManufactured: z.boolean(),
  });
}

export type ProductFormValues = z.infer<ReturnType<typeof useProductSchema>>;

export type ProductInitial = {
  id: string;
  name: string;
  categoryId: string | null;
  type: ProductFormValues["type"];
  tracking: ProductFormValues["tracking"];
  unitId: string | null;
  purchaseUnitId: string | null;
  listPrice: number;
  standardCost: number;
  isPurchasable: boolean;
  isSellable: boolean;
  isManufactured: boolean;
};

export function emptyProductTemplate(): ProductInitial {
  return {
    id: "",
    name: "",
    categoryId: null,
    type: "stockable",
    unitId: null,
    purchaseUnitId: null,
    listPrice: 0,
    standardCost: 0,
    isPurchasable: true,
    isSellable: true,
    isManufactured: false,
    tracking: "none",
  };
}

export function toProductFormValues(template: ProductInitial): ProductFormValues {
  return {
    name: template.name,
    categoryId: template.categoryId ?? "",
    type: template.type,
    tracking: template.tracking,
    unitId: template.unitId ?? "",
    purchaseUnitId: template.purchaseUnitId ?? "",
    listPrice: String(template.listPrice),
    standardCost: String(template.standardCost),
    isPurchasable: template.isPurchasable,
    isSellable: template.isSellable,
    isManufactured: template.isManufactured,
  };
}
