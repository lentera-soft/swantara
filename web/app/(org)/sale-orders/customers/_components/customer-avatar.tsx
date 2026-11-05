"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Camera } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/avatar";
import { Button } from "@/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/card";
import type { Contact } from "@/lib/services/swantara";
import { getSwantaraService } from "@/lib/services/swantara";
import { endpoints } from "@/lib/services/swantara/endpoints";
import { getInitials } from "@/lib/utils";

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

export function CustomerAvatar({ orgId, contact }: { orgId: string; contact: Contact }) {
  const t = useTranslations("Sales");
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const displayName = contact.displayName ?? contact.name;
  const bust = contact.updatedAt ? new Date(contact.updatedAt).getTime() : 0;
  const src = `${endpoints.contacts.avatar(orgId, String(contact.id))}?v=${bust}`;

  const uploadMutation = useMutation({
    mutationFn: (file: File) =>
      getSwantaraService().contacts.uploadAvatar(Number(orgId), contact.id, file),
    onSuccess: () => {
      toast.success(t("avatarUploaded"));
      void queryClient.invalidateQueries({
        queryKey: ["contact", orgId, String(contact.id)],
      });
    },
    onError: () => {
      toast.error(t("avatarUploadFailed"));
    },
  });

  function handleFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error(t("avatarNotImage"));
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      toast.error(t("avatarTooLarge"));
      return;
    }
    uploadMutation.mutate(file);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("avatarTitle")}</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center gap-4">
        <Avatar size="lg">
          <AvatarImage src={src} alt={displayName} />
          <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(event) => {
              handleFile(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
          <Button
            size="sm"
            variant="outline"
            disabled={uploadMutation.isPending}
            onClick={() => inputRef.current?.click()}
          >
            <Camera aria-hidden />
            <span>{uploadMutation.isPending ? t("avatarUploading") : t("avatarUpload")}</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
