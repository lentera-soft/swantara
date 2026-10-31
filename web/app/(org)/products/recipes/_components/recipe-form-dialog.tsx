"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/button";
import { EntityFormDialog } from "@/components/entity-form-dialog";
import { FormField } from "@/components/form";
import { Input } from "@/components/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/select";
import { Switch } from "@/components/switch";
import { useOrgListQuery } from "@/lib/hooks/use-org-query";
import type { RoutingOperation, Unit } from "@/lib/services/swantara";
import { getSwantaraService } from "@/lib/services/swantara";
import { formatNumber } from "@/lib/utils";
import { bomTypes, type StubItem } from "../../_components/products-data";

type TFn = (key: string, values?: Record<string, string | number>) => string;

function useLineSchema() {
  const t = (useTranslations as unknown as (ns: string) => TFn)("Products");
  return z.object({
    id: z.string(),
    componentId: z.string().min(1, t("validationComponentRequired")),
    qty: z
      .string()
      .min(1, t("validationQtyRequired"))
      .refine((value) => Number(value) > 0, t("validationQtyPositive")),
    unitId: z.string(),
    scrapPct: z.string().refine((value) => Number(value) >= 0, t("validationScrapNonNegative")),
  });
}

function useOperationSchema() {
  const t = (useTranslations as unknown as (ns: string) => TFn)("Products");
  return z.object({
    id: z.string(),
    workCenterId: z.string().min(1, t("validationWorkCenterRequired")),
    name: z.string().min(1, t("validationOperationNameRequired")),
    sequence: z.string().refine((value) => Number(value) >= 0, t("validationSequenceNonNegative")),
    setupMinutes: z
      .string()
      .refine((value) => Number(value) >= 0, t("validationMinutesNonNegative")),
    timeMinutes: z
      .string()
      .refine((value) => Number(value) >= 0, t("validationMinutesNonNegative")),
  });
}

function useRecipeSchema() {
  const t = (useTranslations as unknown as (ns: string) => TFn)("Products");
  const lineSchema = useLineSchema();
  const operationSchema = useOperationSchema();
  return z.object({
    itemId: z.string().min(1, t("validationItemRequired")),
    code: z.string(),
    type: z.enum(bomTypes),
    qty: z
      .string()
      .min(1, t("validationQtyRequired"))
      .refine((value) => Number(value) > 0, t("validationQtyPositive")),
    unitId: z.string(),
    version: z
      .string()
      .min(1, t("validationVersionRequired"))
      .refine((value) => Number(value) >= 1, t("validationVersionRequired")),
    active: z.boolean(),
    lines: z.array(lineSchema).min(1, t("validationLinesRequired")),
    operations: z.array(operationSchema),
  });
}

type Values = z.infer<ReturnType<typeof useRecipeSchema>>;
type LineValues = z.infer<ReturnType<typeof useLineSchema>>;
type OperationValues = z.infer<ReturnType<typeof useOperationSchema>>;

function bomLineTotalQty(line: { qty: number; scrapPct: number }): number {
  return line.qty * (1 + line.scrapPct / 100);
}

export function BomFormDialog({
  open,
  onOpenChange,
  orgId,
  templates,
  initial,
  initialLines,
  initialSteps = [],
  nextVersion = 1,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  templates: StubItem[];
  initial?: {
    id: string;
    itemId: string;
    code: string | null;
    type: Values["type"];
    qty: number;
    unitId: string | null;
    version: number;
    active: boolean;
  };
  initialLines?: {
    id: string;
    componentId: string;
    qty: number;
    unitId: string | null;
    scrapPct: number;
  }[];
  initialSteps?: RoutingOperation[];
  nextVersion?: number;
  onSave: () => void;
}) {
  const t = (useTranslations as unknown as (ns: string) => TFn)("Products");
  const tCommon = useTranslations("Common");
  const schema = useRecipeSchema();
  const unitsQuery = useOrgListQuery<{ units: Unit[] }, Record<string, never>>("units", () =>
    getSwantaraService().units.list(),
  );
  const uomOptions = (unitsQuery.data?.units ?? []).map((unit) => ({
    id: String(unit.id),
    name: unit.name,
  }));
  const workCentersQuery = useOrgListQuery<
    { workCenters: { id: number; name: string }[] },
    Record<string, never>
  >("workCenters", (organizationId) => getSwantaraService().workCenters.list(organizationId));
  const workCenters = workCentersQuery.data?.workCenters ?? [];

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: initial
      ? toValues(initial, initialLines ?? [], initialSteps)
      : emptyValues(nextVersion),
  });
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "lines",
  });
  const {
    fields: operationFields,
    append: appendOperation,
    remove: removeOperation,
  } = useFieldArray({
    control: form.control,
    name: "operations",
  });
  const lineValues = form.watch("lines");

  async function syncOperations(values: Values, recipeId: number) {
    const service = getSwantaraService();
    const organizationId = Number(orgId) || 0;
    const keptIds = new Set(values.operations.map((operation) => operation.id).filter(Boolean));
    const removed = initialSteps.filter((step) => !keptIds.has(String(step.id)));
    await Promise.all(
      removed.map((step) => service.recipes.deleteStep(organizationId, recipeId, step.id)),
    );
    for (const operation of values.operations) {
      const body = {
        workCenterId: Number(operation.workCenterId) || 0,
        name: operation.name,
        sequence: Number(operation.sequence) || 0,
        setupMinutes: Number(operation.setupMinutes) || 0,
        timeMinutes: Number(operation.timeMinutes) || 0,
      };
      if (operation.id) {
        await service.recipes.updateStep(organizationId, recipeId, Number(operation.id), body);
      } else {
        await service.recipes.createStep(organizationId, recipeId, body);
      }
    }
  }

  async function handleSubmit(values: Values) {
    const organizationId = Number(orgId) || 0;
    try {
      if (initial) {
        const { recipe } = await getSwantaraService().recipes.update(
          organizationId,
          Number(initial.id) || 0,
          {
            organizationId,
            itemId: Number(values.itemId) || 0,
            code: values.code || null,
            type: values.type,
            qty: Number(values.qty) || 0,
            unitId: values.unitId === "" ? null : Number(values.unitId) || null,
            version: Number(values.version) || 1,
            active: values.active,
          },
        );
        await syncOperations(values, recipe.id);
      } else {
        const { recipe } = await getSwantaraService().recipes.create(organizationId, {
          organizationId,
          itemId: Number(values.itemId) || 0,
          code: values.code || null,
          type: values.type,
          qty: Number(values.qty) || 0,
          unitId: values.unitId === "" ? null : Number(values.unitId) || null,
          version: Number(values.version) || 1,
          lines: values.lines.map((line) => ({
            componentId: Number(line.componentId) || 0,
            qty: Number(line.qty) || 0,
            unitId: line.unitId === "" ? null : Number(line.unitId) || null,
            scrapPct: Number(line.scrapPct || 0),
          })),
        });
        await syncOperations(values, recipe.id);
      }
      toast.success(t("toastRecipeSaved"));
      onSave();
    } catch {
      toast.error(t("toastFailed"));
    }
  }

  const totalWithScrap = (lineValues ?? []).reduce(
    (sum, line) =>
      sum +
      (Number(line?.qty) > 0
        ? bomLineTotalQty({
            qty: Number(line.qty),
            scrapPct: Number(line.scrapPct || 0),
          })
        : 0),
    0,
  );

  return (
    <EntityFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={initial ? t("editRecipe") : t("newRecipe")}
      description={t("recipesDescription")}
      form={form}
      onSubmit={handleSubmit}
      submitLabel={tCommon("save")}
      cancelLabel={tCommon("cancel")}
      className="max-h-[85vh] overflow-y-auto sm:max-w-3xl"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField name="itemId" label={t("fieldItem")}>
          {({ field, id }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id={id} aria-label={t("fieldItem")}>
                <SelectValue placeholder={t("fieldItem")} />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </FormField>
        <FormField name="code" label={t("colReference")}>
          {({ field, id }) => <Input {...field} id={id} placeholder={"BOM/..."} />}
        </FormField>
        <FormField name="type" label={t("fieldType")}>
          {({ field, id }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id={id} aria-label={t("fieldType")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {bomTypes.map((bomType) => (
                  <SelectItem key={bomType} value={bomType}>
                    {(t as unknown as (k: string) => string)(`recipeType_${bomType}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </FormField>
        <FormField name="version" label={t("colVersion")}>
          {({ field, id }) => <Input {...field} id={id} type="number" min="1" step="1" />}
        </FormField>
        <FormField name="qty" label={t("colQuantity")}>
          {({ field, id }) => (
            <Input {...field} id={id} type="number" min="0" step="any" inputMode="decimal" />
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
        <FormField name="active" label={t("active")}>
          {({ field }) => (
            <Switch
              checked={field.value}
              onCheckedChange={(checked) => field.onChange(Boolean(checked))}
              aria-label={t("active")}
            />
          )}
        </FormField>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-sm">{t("components")}</p>
        <p className="text-xs text-muted-foreground">{t("componentsDescription")}</p>
        {fields.map((field, index) => (
          <div key={field.id} className="flex items-start gap-2">
            <FormField name={`lines.${index}.componentId`}>
              {({ field: lineField, id }) => (
                <Select value={lineField.value} onValueChange={lineField.onChange}>
                  <SelectTrigger id={id} aria-label={t("component")}>
                    <SelectValue placeholder={t("component")} />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </FormField>
            <FormField name={`lines.${index}.qty`}>
              {({ field: lineField, id }) => (
                <Input
                  {...lineField}
                  id={id}
                  type="number"
                  min="0"
                  step="any"
                  inputMode="decimal"
                  placeholder={t("colQuantity")}
                  aria-label={t("colQuantity")}
                  className="w-24"
                />
              )}
            </FormField>
            <FormField name={`lines.${index}.scrapPct`}>
              {({ field: lineField, id }) => (
                <Input
                  {...lineField}
                  id={id}
                  type="number"
                  min="0"
                  step="any"
                  inputMode="decimal"
                  placeholder={t("scrapPct")}
                  aria-label={t("scrapPct")}
                  className="w-20"
                />
              )}
            </FormField>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => remove(index)}
              aria-label={t("removeLine")}
            >
              <X />
            </Button>
          </div>
        ))}
        <div className="flex items-center justify-between">
          <Button type="button" size="sm" variant="outline" onClick={() => append(emptyLine())}>
            <Plus />
            <span>{t("addComponent")}</span>
          </Button>
          <span className="text-sm text-muted-foreground">
            {t("totalInclScrap", { value: formatNumber(totalWithScrap) })}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-sm">{t("routingOperations")}</p>
        <p className="text-xs text-muted-foreground">{t("routingOperationsDescription")}</p>
        {operationFields.length === 0 ? (
          <p className="text-xs text-muted-foreground">{t("noRoutingOperations")}</p>
        ) : null}
        {operationFields.map((field, index) => (
          <div
            key={field.id}
            className="grid grid-cols-[1fr_1fr_4.5rem_4.5rem_4.5rem_auto] items-start gap-2"
          >
            <FormField name={`operations.${index}.name`}>
              {({ field: operationField, id }) => (
                <Input
                  {...operationField}
                  id={id}
                  placeholder={t("operationName")}
                  aria-label={t("operationName")}
                />
              )}
            </FormField>
            <FormField name={`operations.${index}.workCenterId`}>
              {({ field: operationField, id }) => (
                <Select value={operationField.value} onValueChange={operationField.onChange}>
                  <SelectTrigger id={id} aria-label={t("workCenter")}>
                    <SelectValue placeholder={t("workCenter")} />
                  </SelectTrigger>
                  <SelectContent>
                    {workCenters.map((center) => (
                      <SelectItem key={center.id} value={String(center.id)}>
                        {center.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </FormField>
            <FormField name={`operations.${index}.sequence`}>
              {({ field: operationField, id }) => (
                <Input
                  {...operationField}
                  id={id}
                  type="number"
                  min="0"
                  step="1"
                  placeholder={t("sequence")}
                  aria-label={t("sequence")}
                />
              )}
            </FormField>
            <FormField name={`operations.${index}.setupMinutes`}>
              {({ field: operationField, id }) => (
                <Input
                  {...operationField}
                  id={id}
                  type="number"
                  min="0"
                  step="any"
                  placeholder={t("setupMinutes")}
                  aria-label={t("setupMinutes")}
                />
              )}
            </FormField>
            <FormField name={`operations.${index}.timeMinutes`}>
              {({ field: operationField, id }) => (
                <Input
                  {...operationField}
                  id={id}
                  type="number"
                  min="0"
                  step="any"
                  placeholder={t("timeMinutes")}
                  aria-label={t("timeMinutes")}
                />
              )}
            </FormField>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeOperation(index)}
              aria-label={t("removeOperation")}
            >
              <X />
            </Button>
          </div>
        ))}
        <div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => appendOperation(emptyOperation())}
          >
            <Plus />
            <span>{t("addOperation")}</span>
          </Button>
        </div>
      </div>
    </EntityFormDialog>
  );
}

function emptyLine(): LineValues {
  return {
    id: `line-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    componentId: "",
    qty: "",
    unitId: "",
    scrapPct: "0",
  };
}

function emptyOperation(): OperationValues {
  return {
    id: "",
    workCenterId: "",
    name: "",
    sequence: "0",
    setupMinutes: "0",
    timeMinutes: "0",
  };
}

function emptyValues(nextVersion: number): Values {
  return {
    itemId: "",
    code: "",
    type: "manufacture",
    qty: "1",
    unitId: "",
    version: String(nextVersion),
    active: true,
    lines: [emptyLine()],
    operations: [],
  };
}

function toValues(
  recipe: {
    itemId: string;
    code: string | null;
    type: Values["type"];
    qty: number;
    unitId: string | null;
    version: number;
    active: boolean;
  },
  lines: {
    id: string;
    componentId: string;
    qty: number;
    unitId: string | null;
    scrapPct: number;
  }[],
  operations: RoutingOperation[] = [],
): Values {
  return {
    itemId: recipe.itemId,
    code: recipe.code ?? "",
    type: recipe.type,
    qty: String(recipe.qty),
    unitId: recipe.unitId ?? "",
    version: String(recipe.version),
    active: recipe.active,
    lines: lines.map((line) => ({
      id: line.id,
      componentId: line.componentId,
      qty: String(line.qty),
      unitId: line.unitId ?? "",
      scrapPct: String(line.scrapPct),
    })),
    operations: operations.map((operation) => ({
      id: String(operation.id),
      workCenterId: operation.workCenterId != null ? String(operation.workCenterId) : "",
      name: operation.name ?? "",
      sequence: String(operation.sequence),
      setupMinutes: String(operation.setupMinutes),
      timeMinutes: String(operation.timeMinutes),
    })),
  };
}
