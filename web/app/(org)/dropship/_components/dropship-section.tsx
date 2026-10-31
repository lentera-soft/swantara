"use client";

import { PackageCheck, Truck } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/card";
import { usePermissions } from "@/lib/hooks/use-permissions";
import { DropshipCreateDialog } from "./dropship-create-dialog";
import { DropshipReceiveDialog } from "./dropship-receive-dialog";

export function DropshipSection({ orgId }: { orgId: string }) {
  const t = useTranslations("Dropship");
  const { has } = usePermissions();
  const [createOpen, setCreateOpen] = useState(false);
  const [receiveOpen, setReceiveOpen] = useState(false);

  const canCreate = has("dropship_order.create");
  const canReceive = has("dropship_order.update");

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        {canCreate ? (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Truck className="size-4 text-muted-foreground" aria-hidden />
                <CardTitle className="text-sm">{t("createTitle")}</CardTitle>
              </div>
              <CardDescription>{t("createDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button size="sm" onClick={() => setCreateOpen(true)}>
                <Truck />
                <span>{t("submitCreate")}</span>
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {canReceive ? (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <PackageCheck className="size-4 text-muted-foreground" aria-hidden />
                <CardTitle className="text-sm">{t("receiveTitle")}</CardTitle>
              </div>
              <CardDescription>{t("receiveDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button size="sm" variant="outline" onClick={() => setReceiveOpen(true)}>
                <PackageCheck />
                <span>{t("submitReceive")}</span>
              </Button>
            </CardContent>
          </Card>
        ) : null}
      </div>

      {createOpen ? (
        <DropshipCreateDialog open={createOpen} onOpenChange={setCreateOpen} orgId={orgId} />
      ) : null}
      {receiveOpen ? (
        <DropshipReceiveDialog open={receiveOpen} onOpenChange={setReceiveOpen} orgId={orgId} />
      ) : null}
    </>
  );
}
