"use client";

import { FileIcon, UploadCloudIcon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/button";
import { cn, formatBytes } from "@/lib/utils";

export type AttachmentDropzoneProps = {
  /** Controlled staged files. Leave undefined when using onFilesAdded (upload-on-drop mode). */
  files?: File[];
  /** Fires when the staged list changes (controlled mode). */
  onChange?: (files: File[]) => void;
  /** Fires with newly accepted files and renders no staged list (uncontrolled upload mode). */
  onFilesAdded?: (files: File[]) => void;
  /** Input accept attribute, e.g. "image/*,.pdf". */
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  maxSizeBytes?: number;
  disabled?: boolean;
  label?: string;
  hint?: string;
  className?: string;
  id?: string;
};

function matchesAccept(file: File, accept: string | undefined): boolean {
  if (!accept) {
    return true;
  }
  const types = accept
    .split(",")
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean);
  if (types.length === 0) {
    return true;
  }
  const name = file.name.toLowerCase();
  const mime = file.type.toLowerCase();
  return types.some((token) => {
    if (token.startsWith(".")) {
      return name.endsWith(token);
    }
    if (token.endsWith("/*")) {
      return mime.startsWith(token.slice(0, -1));
    }
    return mime === token;
  });
}

export function AttachmentDropzone({
  files,
  onChange,
  onFilesAdded,
  accept,
  multiple = true,
  maxFiles,
  maxSizeBytes,
  disabled = false,
  label,
  hint,
  className,
  id,
}: AttachmentDropzoneProps) {
  const t = useTranslations("Dropzone");
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const staged = files ?? [];
  const isStagedMode = files !== undefined || onChange !== undefined;

  const previews = useMemo(() => {
    const map = new Map<string, string>();
    if (typeof URL.createObjectURL !== "function") {
      return map;
    }
    for (const file of staged) {
      if (file.type.startsWith("image/")) {
        map.set(`${file.name}:${file.size}:${file.lastModified}`, URL.createObjectURL(file));
      }
    }
    return map;
  }, [staged]);

  useEffect(() => {
    return () => {
      for (const url of previews.values()) {
        URL.revokeObjectURL(url);
      }
    };
  }, [previews]);

  function openPicker() {
    if (!disabled) {
      inputRef.current?.click();
    }
  }

  function handleIncoming(incoming: File[]) {
    if (incoming.length === 0) {
      return;
    }
    const accepted: File[] = [];
    for (const file of incoming) {
      if (!matchesAccept(file, accept)) {
        toast.error(t("invalidFileType", { name: file.name }));
        continue;
      }
      if (maxSizeBytes !== undefined && file.size > maxSizeBytes) {
        toast.error(t("fileTooLarge", { name: file.name, max: formatBytes(maxSizeBytes) }));
        continue;
      }
      accepted.push(file);
    }
    if (accepted.length === 0) {
      return;
    }
    if (!isStagedMode) {
      onFilesAdded?.(accepted);
      return;
    }
    const existingKeys = new Set(
      staged.map((file) => `${file.name}:${file.size}:${file.lastModified}`),
    );
    const merged = multiple
      ? [
          ...staged,
          ...accepted.filter(
            (file) => !existingKeys.has(`${file.name}:${file.size}:${file.lastModified}`),
          ),
        ]
      : accepted.slice(0, 1);
    if (maxFiles !== undefined && merged.length > maxFiles) {
      toast.error(t("tooManyFiles", { max: maxFiles }));
      onChange?.(merged.slice(0, maxFiles));
      return;
    }
    onChange?.(merged);
  }

  function removeFile(target: File) {
    onChange?.(staged.filter((file) => file !== target));
  }

  return (
    <div data-slot="attachment-dropzone" className={cn("flex flex-col gap-2", className)}>
      <button
        type="button"
        disabled={disabled}
        aria-label={label ?? t("title")}
        onClick={openPicker}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) {
            setDragging(true);
          }
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          if (disabled) {
            return;
          }
          handleIncoming(Array.from(event.dataTransfer.files));
        }}
        className={cn(
          "flex w-full cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed px-4 py-8 text-center transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-60",
          dragging && "border-primary bg-primary/5",
        )}
      >
        <UploadCloudIcon className="size-6 text-muted-foreground" aria-hidden />
        <span className="block text-sm font-medium">{label ?? t("title")}</span>
        <span className="block text-xs text-muted-foreground">{hint ?? t("hint")}</span>
      </button>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        multiple={multiple}
        className="sr-only"
        onChange={(event) => {
          handleIncoming(Array.from(event.target.files ?? []));
          event.target.value = "";
        }}
      />
      {isStagedMode && staged.length > 0 ? (
        <ul data-slot="attachment-dropzone-list" className="flex flex-wrap gap-2">
          {staged.map((file) => {
            const key = `${file.name}:${file.size}:${file.lastModified}`;
            const preview = previews.get(key);
            return (
              <li
                key={key}
                className="group/attachment relative flex w-24 flex-col items-center gap-1 rounded-lg border border-border bg-card p-2 text-xs"
              >
                <span className="grid aspect-square w-full place-items-center overflow-hidden rounded-md bg-muted">
                  {preview ? (
                    // biome-ignore lint/performance/noImgElement: local object-URL preview of a staged file
                    <img src={preview} alt={file.name} className="size-full object-cover" />
                  ) : (
                    <FileIcon className="size-5 text-muted-foreground" aria-hidden />
                  )}
                </span>
                <p className="w-full truncate" title={file.name}>
                  {file.name}
                </p>
                <p className="text-[11px] text-muted-foreground tabular-nums">
                  {formatBytes(file.size)}
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  className="absolute -top-1.5 -right-1.5 size-5 rounded-full border border-border bg-card shadow-sm"
                  aria-label={t("removeFile", { name: file.name })}
                  onClick={(event) => {
                    event.stopPropagation();
                    removeFile(file);
                  }}
                >
                  <XIcon className="size-3" aria-hidden />
                </Button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
