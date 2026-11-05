"use client";

import { ImageIcon, StarIcon, Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { AttachmentDropzone } from "@/components/attachment-dropzone";
import { Button } from "@/components/button";
import { EmptyState } from "@/components/empty-state";
import { useOrgListQuery } from "@/lib/hooks/use-org-query";
import type { Attachment } from "@/lib/services/swantara";
import { getSwantaraService } from "@/lib/services/swantara";
import { endpoints } from "@/lib/services/swantara/endpoints";
import { cn } from "@/lib/utils";

type TFn = (key: string, values?: Record<string, string | number>) => string;

export function ProductImages({ orgId, itemId }: { orgId: string; itemId: string }) {
  const t = (useTranslations as unknown as (ns: string) => TFn)("Products");
  const tCommon = useTranslations("Common");
  const [uploading, setUploading] = useState(false);

  const attachmentsQuery = useOrgListQuery<{ attachments: Attachment[] }, Record<string, never>>(
    "attachments",
    (organizationId) =>
      getSwantaraService().attachments.list(organizationId, {
        ownerType: "product",
        ownerId: Number(itemId),
      }),
  );

  const images = [...(attachmentsQuery.data?.attachments ?? [])]
    .filter((attachment) => attachment.mimeType.startsWith("image/"))
    .sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);

  async function handleFiles(files: File[]) {
    setUploading(true);
    let failed = 0;
    try {
      for (const [index, file] of files.entries()) {
        try {
          await getSwantaraService().attachments.upload(Number(orgId), {
            ownerType: "product",
            ownerId: Number(itemId),
            isPrimary: images.length === 0 && index === 0,
            file,
          });
        } catch {
          failed += 1;
        }
      }
      if (failed > 0) {
        toast.error(t("imagesUploadPartial", { count: failed }));
      } else {
        toast.success(t("imageUploadSuccess"));
      }
      await attachmentsQuery.refetch();
    } finally {
      setUploading(false);
    }
  }

  function handleSetPrimary(image: Attachment) {
    void getSwantaraService()
      .attachments.update(Number(orgId), image.id, { isPrimary: true })
      .then(() => attachmentsQuery.refetch())
      .catch(() => toast.error(t("setPrimaryFailed")));
  }

  function handleRemove(image: Attachment) {
    void getSwantaraService()
      .attachments.delete(Number(orgId), image.id)
      .then(() => attachmentsQuery.refetch())
      .catch(() => toast.error(t("removeImageFailed")));
  }

  if (attachmentsQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">{tCommon("loading")}</p>;
  }
  if (attachmentsQuery.isError) {
    return (
      <p className="text-sm text-destructive">
        {t("imagesLoadFailed", { message: attachmentsQuery.error.message })}
      </p>
    );
  }

  return (
    <div data-slot="product-images" className="flex flex-col gap-4">
      <AttachmentDropzone
        accept="image/*"
        onFilesAdded={handleFiles}
        disabled={uploading}
        maxFiles={10}
        maxSizeBytes={10 * 1024 * 1024}
        label={uploading ? t("imagesUploading") : undefined}
      />
      {images.length === 0 ? (
        <EmptyState
          title={t("imagesEmptyTitle")}
          description={t("imagesEmptyHint")}
          icon={ImageIcon}
        />
      ) : (
        <ul
          data-slot="product-images-grid"
          className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4"
        >
          {images.map((image) => (
            <li
              key={image.id}
              className={cn(
                "group/product-image relative overflow-hidden rounded-lg border",
                image.isPrimary ? "border-primary ring-1 ring-primary/40" : "border-border",
              )}
            >
              {/* biome-ignore lint/performance/noImgElement: attachment streams through the BFF endpoint */}
              <img
                src={endpoints.attachments.download(orgId, String(image.id))}
                alt={image.filename}
                className="aspect-square w-full object-cover"
              />
              {image.isPrimary ? (
                <span className="absolute top-1.5 left-1.5 rounded-full bg-primary px-2 py-0.5 text-[11px] font-medium text-primary-foreground">
                  {t("primaryImage")}
                </span>
              ) : null}
              <div className="absolute right-1.5 bottom-1.5 flex gap-1 opacity-0 transition-opacity group-hover/product-image:opacity-100 focus-within:opacity-100">
                {!image.isPrimary ? (
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon-xs"
                    aria-label={t("setPrimary", { name: image.filename })}
                    onClick={() => handleSetPrimary(image)}
                  >
                    <StarIcon aria-hidden />
                  </Button>
                ) : null}
                <Button
                  type="button"
                  variant="secondary"
                  size="icon-xs"
                  aria-label={t("removeImage", { name: image.filename })}
                  onClick={() => handleRemove(image)}
                >
                  <Trash2Icon aria-hidden />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
