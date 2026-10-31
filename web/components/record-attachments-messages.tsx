"use client";

import { UploadIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { type AttachmentItem, AttachmentList } from "@/components/attachment-list";
import { Button } from "@/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/dialog";
import { PdfViewer } from "@/components/pdf-viewer";
import { Thread, type ThreadMessage } from "@/components/thread";
import { useOrgListQuery } from "@/lib/hooks/use-org-query";
import { getSwantaraService } from "@/lib/services/swantara";
import { endpoints } from "@/lib/services/swantara/endpoints";
import type { Attachment, Message } from "@/lib/services/swantara/types";

export function RecordAttachmentsMessages({
  orgId,
  ownerType,
  ownerId,
}: {
  orgId: string;
  ownerType: string;
  ownerId: number;
}) {
  const t = useTranslations("Record");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [previewItem, setPreviewItem] = useState<AttachmentItem | null>(null);

  const attachmentsQuery = useOrgListQuery<{ attachments: Attachment[] }, Record<string, unknown>>(
    "attachments",
    (organizationId) =>
      getSwantaraService().attachments.list(organizationId, { ownerType, ownerId }),
  );

  const messagesQuery = useOrgListQuery<{ messages: Message[] }, Record<string, unknown>>(
    "messages",
    (organizationId) => getSwantaraService().messages.list(organizationId, { ownerType, ownerId }),
  );

  const attachments: AttachmentItem[] =
    attachmentsQuery.data?.attachments.map((attachment) => ({
      id: String(attachment.id),
      name: attachment.filename,
      size: attachment.byteSize,
      mimeType: attachment.mimeType,
      downloadUrl: endpoints.attachments.download(orgId, String(attachment.id)),
    })) ?? [];

  const messages: ThreadMessage[] =
    messagesQuery.data?.messages.map((message) => ({
      id: String(message.id),
      author: `#${message.authorId}`,
      body: message.body,
      timestamp: String(message.createdAt),
    })) ?? [];

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) {
      return;
    }
    const selected = Array.from(files);
    setUploading(true);
    void (async () => {
      try {
        for (const file of selected) {
          await getSwantaraService().attachments.upload(Number(orgId), {
            ownerType,
            ownerId,
            file,
          });
        }
        toast.success(t("uploadSuccess"));
        await attachmentsQuery.refetch();
      } catch {
        toast.error(t("uploadFailed"));
      } finally {
        setUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    })();
  }

  function handleRemove(id: string) {
    void getSwantaraService()
      .attachments.delete(Number(orgId), Number(id))
      .then(() => {
        toast.success(t("deleteAttachmentSuccess"));
        void attachmentsQuery.refetch();
      })
      .catch(() => toast.error(t("deleteFailed")));
  }

  function handleMessageSubmit(content: string) {
    return toast
      .promise(
        getSwantaraService().messages.create(Number(orgId), {
          ownerType,
          ownerId,
          body: content,
          messageType: "note",
        }),
        {
          loading: t("sending"),
          success: () => {
            void messagesQuery.refetch();
            return t("messageSent");
          },
          error: t("messageFailed"),
        },
      )
      .unwrap()
      .then(() => undefined);
  }

  function handlePreview(item: AttachmentItem) {
    if (item.mimeType === "application/pdf") {
      setPreviewItem(item);
      return;
    }
    if (item.downloadUrl) {
      window.open(item.downloadUrl, "_blank", "noopener,noreferrer");
    }
  }

  return (
    <div data-slot="record-attachments-messages" className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader className="flex-row items-center justify-between gap-2">
          <CardTitle className="text-sm">{t("attachmentsTitle")}</CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
            aria-busy={uploading || undefined}
            onClick={() => fileInputRef.current?.click()}
          >
            <UploadIcon aria-hidden />
            <span>{uploading ? t("uploading") : t("upload")}</span>
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="sr-only"
            onChange={(event) => handleFiles(event.target.files)}
          />
          {attachmentsQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">{"…"}</p>
          ) : attachments.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("attachmentsEmpty")}</p>
          ) : (
            <AttachmentList
              attachments={attachments}
              onPreview={handlePreview}
              onRemove={handleRemove}
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">{t("messagesTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          {messagesQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">{"…"}</p>
          ) : (
            <Thread messages={messages} onSubmit={handleMessageSubmit} />
          )}
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(previewItem)}
        onOpenChange={(open) => {
          if (!open) {
            setPreviewItem(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>{t("pdfPreviewTitle")}</DialogTitle>
            <DialogDescription>{previewItem?.name}</DialogDescription>
          </DialogHeader>
          {previewItem?.downloadUrl ? <PdfViewer file={{ url: previewItem.downloadUrl }} /> : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
