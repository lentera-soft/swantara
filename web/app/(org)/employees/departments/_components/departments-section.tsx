"use client";

import type { LegacyColumnDef as ColumnDef } from "@tanstack/react-table/legacy";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { InteractiveEntityTable } from "@/app/(org)/_components/interactive-entity-table";
import { RowActions } from "@/app/(org)/_components/row-actions";
import { Button } from "@/components/button";
import { useOrgListQuery } from "@/lib/hooks/use-org-query";
import type { Department } from "@/lib/services/swantara";
import { getSwantaraService } from "@/lib/services/swantara";
import { DepartmentFormDialog } from "./department-form-dialog";

export function DepartmentsSection({ orgId }: { orgId: string }) {
  const t = useTranslations("Employees");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDepartment, setEditDepartment] = useState<Department | null>(null);

  const departmentsQuery = useOrgListQuery<{ departments: Department[] }, Record<string, never>>(
    "departments",
    (organizationId) => getSwantaraService().departments.list(organizationId),
  );

  const departments = departmentsQuery.data?.departments ?? [];

  function handleSave(_id: string) {
    setDialogOpen(false);
    setEditDepartment(null);
    void departmentsQuery.refetch();
  }

  function handleEdit(department: Department) {
    setEditDepartment(department);
    setDialogOpen(true);
  }

  function handleDelete(department: Department) {
    void getSwantaraService()
      .departments.delete(Number(orgId), department.id)
      .then(() => {
        void departmentsQuery.refetch();
      })
      .catch(() => toast.error(t("deleteFailed")));
  }

  const columns: ColumnDef<Department>[] = [
    {
      accessorKey: "name",
      header: t("tableName"),
      cell: ({ row }) => <span className="">{row.original.name}</span>,
    },
    {
      accessorKey: "description",
      header: t("tableDescription"),
      cell: ({ row }) =>
        row.original.description ?? <span className="text-muted-foreground">—</span>,
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <RowActions
          onEdit={() => handleEdit(row.original)}
          onDelete={() => handleDelete(row.original)}
          confirmTitle={t("deleteDepartmentTitle")}
          confirmDescription={t("deleteDepartmentDescription")}
        />
      ),
    },
  ];

  const isLoading = departmentsQuery.isLoading;
  const error = departmentsQuery.isError ? departmentsQuery.error : null;

  return (
    <div className="flex flex-col gap-4">
      <InteractiveEntityTable
        columns={columns}
        data={departments}
        getRowId={(row) => String(row.id)}
        searchKeys={["name", "description"]}
        searchPlaceholder={t("searchDepartmentsPlaceholder")}
        ariaLabel={t("departmentsTitle")}
        emptyTitle={t("noDepartments")}
        status={
          isLoading
            ? { type: "loading" }
            : error
              ? {
                  type: "error",
                  message: error.message,
                  onRetry: () => void departmentsQuery.refetch(),
                }
              : undefined
        }
        actions={
          <Button
            size="sm"
            onClick={() => {
              setEditDepartment(null);
              setDialogOpen(true);
            }}
          >
            <Plus />
            <span>{t("addDepartment")}</span>
          </Button>
        }
      />
      {dialogOpen ? (
        <DepartmentFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          orgId={orgId}
          initial={editDepartment}
          onSave={handleSave}
        />
      ) : null}
    </div>
  );
}
