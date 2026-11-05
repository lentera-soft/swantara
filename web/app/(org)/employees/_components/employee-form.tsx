"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/button";
import { DatePicker } from "@/components/date-picker";
import { DetailPageSkeleton } from "@/components/detail-page-skeleton";
import { Form, FormField, SubmitButton } from "@/components/form";
import { FormSection } from "@/components/form-section";
import { Input } from "@/components/input";
import { MultiCurrencyInput } from "@/components/multi-currency-input";
import { PageHeader } from "@/components/page-header";
import { PhoneInput } from "@/components/phone-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/select";
import { useActiveOrgCurrency } from "@/lib/hooks/use-org-context";
import { useOrgListQuery, useOrgQuery } from "@/lib/hooks/use-org-query";
import type { Department, Employee, JobPosition } from "@/lib/services/swantara";
import { getSwantaraService } from "@/lib/services/swantara";
import { getLocalDateString } from "@/lib/utils";
import { humanizeKey } from "@/lib/utils/case";

const EMPLOYEES_HREF = "/employees";

const employmentTypes = ["full_time", "part_time", "contract"] as const;
const wageTypes = ["monthly", "hourly"] as const;

function useEmployeeFormSchema() {
  const t = useTranslations("Employees");
  return z.object({
    name: z.string().trim().min(1, t("validationNameRequired")),
    employeeNumber: z.string().trim().min(1, t("validationEmployeeNumberRequired")),
    email: z.string().trim(),
    phone: z.string().trim(),
    userId: z.string().trim(),
    departmentId: z.string().trim(),
    jobPositionId: z.string().trim(),
    hireDate: z.string().trim(),
    employmentType: z.enum(employmentTypes),
    workLocation: z.string().trim(),
    wage: z
      .string()
      .trim()
      .refine((value) => Number(value) >= 0, t("validationWageInvalid")),
    wageType: z.enum(wageTypes),
    currencyCode: z.string().trim(),
  });
}
type EmployeeFormValues = z.infer<ReturnType<typeof useEmployeeFormSchema>>;

export function EmployeeForm({
  orgId,
  initial,
  cancelHref = EMPLOYEES_HREF,
}: {
  orgId: string;
  initial?: Employee | null;
  cancelHref?: string;
}) {
  const isEdit = Boolean(initial);
  const t = useTranslations("Employees");
  const tCommon = useTranslations("Common");
  const router = useRouter();
  const queryClient = useQueryClient();

  const departmentsQuery = useOrgListQuery<{ departments: Department[] }, Record<string, never>>(
    "departments",
    (organizationId) => getSwantaraService().departments.list(organizationId),
  );

  const jobPositionsQuery = useOrgListQuery<{ jobPositions: JobPosition[] }, Record<string, never>>(
    "jobPositions",
    (organizationId) => getSwantaraService().jobPositions.list(organizationId),
  );

  const currenciesQuery = useQuery({
    queryKey: ["currencies"],
    queryFn: () => getSwantaraService().currencies.list(),
  });

  const departments = departmentsQuery.data?.departments ?? [];
  const jobPositions = jobPositionsQuery.data?.jobPositions ?? [];
  const currencyOptions = (currenciesQuery.data?.currencies ?? []).map((currency) => currency.code);

  const schema = useEmployeeFormSchema();
  const orgCurrency = useActiveOrgCurrency();

  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(schema),
    defaultValues: initial
      ? {
          name: "",
          employeeNumber: initial.employeeNumber,
          email: "",
          phone: "",
          userId: initial.userId != null ? String(initial.userId) : "",
          departmentId: initial.departmentId != null ? String(initial.departmentId) : "",
          jobPositionId: initial.jobPositionId != null ? String(initial.jobPositionId) : "",
          hireDate: initial.hireDate ?? "",
          employmentType: initial.employmentType,
          workLocation: initial.workLocation ?? "",
          wage: "0",
          wageType: "monthly",
          currencyCode: orgCurrency,
        }
      : {
          name: "",
          employeeNumber: "",
          email: "",
          phone: "",
          userId: "",
          departmentId: "",
          jobPositionId: "",
          hireDate: "",
          employmentType: "full_time",
          workLocation: "",
          wage: "0",
          wageType: "monthly",
          currencyCode: orgCurrency,
        },
  });

  const saveMutation = useMutation({
    mutationFn: (values: EmployeeFormValues) => {
      if (isEdit && initial) {
        return getSwantaraService().employees.update(Number(orgId) || 0, initial.id, {
          name: values.name,
          employeeNumber: values.employeeNumber,
          userId: values.userId === "" ? null : Number(values.userId) || null,
          departmentId: values.departmentId === "" ? null : Number(values.departmentId) || null,
          jobPositionId: values.jobPositionId === "" ? null : Number(values.jobPositionId) || null,
          managerId: initial.managerId,
          hireDate: values.hireDate || null,
          terminationDate: initial.terminationDate,
          employmentType: values.employmentType,
          workLocation: values.workLocation || null,
          active: initial.active,
        });
      }
      return getSwantaraService().employees.create(Number(orgId) || 0, {
        organizationId: Number(orgId) || 0,
        name: values.name,
        email: values.email || null,
        phone: values.phone || null,
        userId: values.userId === "" ? null : Number(values.userId) || null,
        employeeNumber: values.employeeNumber,
        departmentId: values.departmentId === "" ? null : Number(values.departmentId) || null,
        jobPositionId: values.jobPositionId === "" ? null : Number(values.jobPositionId) || null,
        managerId: null,
        hireDate: values.hireDate || null,
        employmentType: values.employmentType,
        workLocation: values.workLocation || null,
        wage: Number(values.wage) || 0,
        wageType: values.wageType,
        currencyCode: values.currencyCode,
      });
    },
    onSuccess: (employee) => {
      toast.success(isEdit ? t("updated") : t("created"));
      void queryClient.invalidateQueries({ queryKey: ["employees"] });
      void queryClient.invalidateQueries({ queryKey: ["employee"] });
      router.push(`${EMPLOYEES_HREF}/${isEdit && initial ? initial.id : employee.id}`);
    },
    onError: () => {
      void toast.error(t("saveFailed"));
    },
  });

  function employmentTypeLabel(key: string): string {
    try {
      return (t as unknown as (k: string) => string)(`employmentType.${key}`);
    } catch {
      return humanizeKey(String(key));
    }
  }

  function wageTypeLabel(key: string): string {
    try {
      return (t as unknown as (k: string) => string)(`wageType.${key}`);
    } catch {
      return humanizeKey(String(key));
    }
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <PageHeader
        force
        title={isEdit ? t("editEmployee") : t("addEmployee")}
        description={t("subtitle")}
      />
      <Form
        form={form}
        onSubmit={(values) => saveMutation.mutate(values)}
        className="flex flex-col gap-4"
      >
        <FormSection title={t("formPersonalInfo")}>
          <FormField name="name" label={t("fieldName")}>
            {({ field, id }) => <Input {...field} id={id} placeholder={t("fieldName")} autoFocus />}
          </FormField>
          <FormField name="employeeNumber" label={t("fieldEmployeeNumber")}>
            {({ field, id }) => <Input {...field} id={id} placeholder={t("fieldEmployeeNumber")} />}
          </FormField>
          <FormField name="email" label={t("fieldEmail")}>
            {({ field, id }) => (
              <Input {...field} id={id} type="email" placeholder={t("fieldEmail")} />
            )}
          </FormField>
          <FormField name="phone" label={t("fieldPhone")}>
            {({ field, id, fieldState }) => (
              <PhoneInput
                id={id}
                defaultCountry="ID"
                autoComplete="tel"
                placeholder="812 3456 7890"
                countryAriaLabel={t("fieldPhone")}
                aria-invalid={Boolean(fieldState.error)}
                value={field.value ?? ""}
                onChange={field.onChange}
              />
            )}
          </FormField>
        </FormSection>

        <FormSection title={t("formEmployment")}>
          <FormField name="departmentId" label={t("fieldDepartment")}>
            {({ field, id }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id={id} aria-label={t("fieldDepartment")}>
                  <SelectValue placeholder={t("selectDepartment")} />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={String(dept.id)}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </FormField>
          <FormField name="jobPositionId" label={t("fieldJobPosition")}>
            {({ field, id }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id={id} aria-label={t("fieldJobPosition")}>
                  <SelectValue placeholder={t("selectJobPosition")} />
                </SelectTrigger>
                <SelectContent>
                  {jobPositions.map((pos) => (
                    <SelectItem key={pos.id} value={String(pos.id)}>
                      {pos.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </FormField>
          <FormField name="hireDate" label={t("fieldHireDate")}>
            {({ field }) => (
              <DatePicker
                selected={field.value ? new Date(`${field.value}T00:00:00`) : undefined}
                onSelect={(day) => field.onChange(day ? getLocalDateString(day) : "")}
                defaultMonth={field.value ? new Date(`${field.value}T00:00:00`) : undefined}
                placeholder={t("fieldHireDate")}
              />
            )}
          </FormField>
          <FormField name="employmentType" label={t("fieldEmploymentType")}>
            {({ field, id }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id={id} aria-label={t("fieldEmploymentType")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {employmentTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {employmentTypeLabel(String(type))}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </FormField>
          <FormField name="workLocation" label={t("fieldWorkLocation")} className="sm:col-span-2">
            {({ field, id }) => <Input {...field} id={id} placeholder={t("fieldWorkLocation")} />}
          </FormField>
        </FormSection>

        <FormSection title={t("formCompensation")}>
          <FormField name="wage" label={t("fieldWage")}>
            {({ field, id, fieldState }) => (
              <MultiCurrencyInput
                id={id}
                currencies={currencyOptions}
                currency={form.watch("currencyCode") || orgCurrency}
                value={field.value === "" ? null : Number(field.value)}
                onCurrencyChange={(code) => form.setValue("currencyCode", code)}
                onValueChange={(value) => field.onChange(String(value ?? 0))}
                currencyAriaLabel={t("fieldCurrency")}
                aria-invalid={Boolean(fieldState?.error)}
              />
            )}
          </FormField>
          <FormField name="wageType" label={t("fieldWageType")}>
            {({ field, id }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id={id} aria-label={t("fieldWageType")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {wageTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {wageTypeLabel(String(type))}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </FormField>
        </FormSection>

        <div className="flex items-center justify-end gap-2">
          <Button type="button" variant="outline" disabled={saveMutation.isPending} asChild>
            <Link href={cancelHref}>{tCommon("cancel")}</Link>
          </Button>
          <SubmitButton loading={saveMutation.isPending} disabled={saveMutation.isPending}>
            {isEdit ? tCommon("save") : t("addEmployee")}
          </SubmitButton>
        </div>
      </Form>
    </div>
  );
}

export function EmployeeFormEdit({
  orgId,
  employeeId,
  cancelHref,
}: {
  orgId: string;
  employeeId: string;
  cancelHref?: string;
}) {
  const t = useTranslations("Employees");

  const employeeQuery = useOrgQuery<Employee>("employee", employeeId, (organizationId) =>
    getSwantaraService().employees.get(organizationId, Number(employeeId)),
  );

  if (employeeQuery.isLoading) {
    return <DetailPageSkeleton />;
  }

  if (employeeQuery.error) {
    return <p className="text-sm text-destructive">{employeeQuery.error.message}</p>;
  }

  if (!employeeQuery.data) {
    return <p className="text-sm text-muted-foreground">{t("detailNotFound")}</p>;
  }

  return (
    <EmployeeForm
      orgId={orgId}
      initial={employeeQuery.data}
      cancelHref={cancelHref ?? `${EMPLOYEES_HREF}/${employeeId}`}
    />
  );
}
