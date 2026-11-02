"use client";

import { MoreHorizontalIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { type ReactNode, useState } from "react";
import { Button } from "@/components/button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/dropdown";

export type RowActionItem = {
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
  destructive?: boolean;
  onSelect: () => void;
  confirm?: {
    title: string;
    description?: string;
    confirmLabel?: string;
    variant?: "destructive" | "warning" | "neutral";
  };
};

export type RowActionsProps = {
  editLabel?: string;
  deleteLabel?: string;
  confirmTitle?: string;
  confirmDescription?: string;
  confirmLabel?: string;
  onEdit?: () => void;
  onDelete?: () => void;
  items?: RowActionItem[];
};

export function RowActions({
  editLabel,
  deleteLabel,
  confirmTitle,
  confirmDescription,
  confirmLabel,
  onEdit,
  onDelete,
  items,
}: RowActionsProps) {
  const t = useTranslations("Common");
  const [confirmTarget, setConfirmTarget] = useState<RowActionItem | "delete" | null>(null);

  const hasItems = Boolean(items && items.length > 0);
  if (!onEdit && !onDelete && !hasItems) return null;

  const deleteDialog =
    confirmTarget === "delete" && onDelete
      ? {
          title: confirmTitle ?? "",
          description: confirmDescription ?? "",
          confirmLabel: confirmLabel ?? t("delete"),
          variant: "destructive" as const,
          onConfirm: onDelete,
        }
      : null;

  const itemDialog =
    confirmTarget && confirmTarget !== "delete" && confirmTarget.confirm
      ? {
          title: confirmTarget.confirm.title,
          description: confirmTarget.confirm.description,
          confirmLabel: confirmTarget.confirm.confirmLabel ?? confirmTarget.label,
          variant: confirmTarget.confirm.variant ?? ("destructive" as const),
          onConfirm: confirmTarget.onSelect,
        }
      : null;

  const dialog = deleteDialog ?? itemDialog;

  return (
    <div className="flex items-center justify-end">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label={t("actions")}>
            <MoreHorizontalIcon aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {onEdit ? (
            <DropdownMenuItem onClick={onEdit}>
              <PencilIcon aria-hidden />
              {editLabel ?? t("edit")}
            </DropdownMenuItem>
          ) : null}
          {items?.map((item) => (
            <DropdownMenuItem
              key={item.label}
              variant={item.destructive ? "destructive" : "default"}
              disabled={item.disabled}
              onClick={() => {
                if (item.confirm) {
                  setConfirmTarget(item);
                } else {
                  item.onSelect();
                }
              }}
            >
              {item.icon}
              {item.label}
            </DropdownMenuItem>
          ))}
          {onDelete && (onEdit || hasItems) ? <DropdownMenuSeparator /> : null}
          {onDelete ? (
            <DropdownMenuItem variant="destructive" onClick={() => setConfirmTarget("delete")}>
              <Trash2Icon aria-hidden />
              {deleteLabel ?? t("delete")}
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
      {dialog ? (
        <ConfirmDialog
          title={dialog.title}
          description={dialog.description}
          confirmLabel={dialog.confirmLabel}
          variant={dialog.variant}
          onConfirm={() => {
            dialog.onConfirm();
            setConfirmTarget(null);
          }}
          open={confirmTarget !== null}
          onOpenChange={(next) => {
            if (!next) setConfirmTarget(null);
          }}
        />
      ) : null}
    </div>
  );
}
