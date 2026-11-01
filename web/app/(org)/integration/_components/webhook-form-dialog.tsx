"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/dialog";
import { Form, FormField, SubmitButton } from "@/components/form";
import { Input } from "@/components/input";
import { Switch } from "@/components/switch";
import type { WebhookSubscription } from "@/lib/services/swantara";
import { getSwantaraService } from "@/lib/services/swantara";
import { logger } from "@/lib/utils/client-logger";
import { zodResolver } from "@/lib/utils/zod-resolver";

type TFn = (key: string, values?: Record<string, string | number>) => string;

function useWebhookSchema() {
  const t = (useTranslations as unknown as (ns: string) => TFn)("Integration");
  return z.object({
    url: z.string().url(t("validationUrl")),
    secret: z.string(),
    enabled: z.boolean(),
  });
}

type WebhookValues = z.infer<ReturnType<typeof useWebhookSchema>>;

export function WebhookFormDialog({
  open,
  onOpenChange,
  orgId,
  initial,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  initial: WebhookSubscription | null;
  onSaved: () => void;
}) {
  const t = useTranslations("Integration");
  const tCommon = useTranslations("Common");
  const isEdit = Boolean(initial);
  const schema = useWebhookSchema();

  const form = useForm<WebhookValues>({
    resolver: zodResolver<WebhookValues>(schema),
    defaultValues: {
      url: initial?.url ?? "",
      secret: "",
      enabled: initial?.enabled ?? true,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        url: initial?.url ?? "",
        secret: "",
        enabled: initial?.enabled ?? true,
      });
    }
  }, [open, initial, form]);

  function handleSubmit(values: WebhookValues) {
    const payload = {
      url: values.url,
      secret: values.secret || undefined,
      enabled: values.enabled,
    };

    const request = initial
      ? getSwantaraService().webhookSubscriptions.update(Number(orgId), initial.id, payload)
      : getSwantaraService().webhookSubscriptions.create(Number(orgId), payload);

    return request
      .then(() => {
        toast.success(isEdit ? t("webhookUpdated") : t("webhookCreated"));
        form.reset();
        onSaved();
        onOpenChange(false);
      })
      .catch((error) => {
        logger.error("Failed to save webhook subscription", error);
        toast.error(t("saveFailed"));
      });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? t("editWebhook") : t("newWebhook")}</DialogTitle>
          <DialogDescription>{t("webhookFormDescription")}</DialogDescription>
        </DialogHeader>
        <Form form={form} onSubmit={handleSubmit}>
          <FormField name="url" label={t("fieldUrl")}>
            {({ field, id }) => (
              <Input
                {...field}
                id={id}
                type="url"
                placeholder="https://example.com/webhooks"
                autoComplete="off"
              />
            )}
          </FormField>
          <FormField
            name="secret"
            label={t("fieldSecret")}
            description={isEdit ? t("secretHint") : t("secretCreateHint")}
          >
            {({ field, id }) => (
              <Input
                {...field}
                id={id}
                type="password"
                autoComplete="new-password"
                placeholder={isEdit ? "••••••••" : t("secretPlaceholder")}
              />
            )}
          </FormField>
          <FormField name="enabled" label={t("fieldEnabled")}>
            {({ field }) => (
              <Switch
                checked={field.value}
                onCheckedChange={(checked) => field.onChange(Boolean(checked))}
                aria-label={t("fieldEnabled")}
              />
            )}
          </FormField>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {tCommon("cancel")}
            </Button>
            <SubmitButton>{tCommon("save")}</SubmitButton>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
