"use client";

import { ArrowRight, ArrowUpRight, PlugZap } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Badge } from "@/components/badge";
import { Button } from "@/components/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/tabs";
import { AppsSection } from "./apps-section";
import { IntegrationSection } from "./integration-section";

export function IntegrationHub({ orgId }: { orgId: string }) {
  const t = useTranslations("Integration");
  const [tab, setTab] = useState("apps");

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <section className="relative isolate overflow-hidden rounded-2xl border border-teal-500/20 bg-gradient-to-br from-teal-500/10 via-card to-card px-5 py-6 sm:px-8 sm:py-8">
        <div
          aria-hidden="true"
          className="absolute -right-14 -top-20 -z-10 size-64 rounded-full bg-teal-500/10 blur-3xl"
        />
        <div className="max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-teal-500/20 bg-background/70 px-3 py-1 text-xs font-medium text-teal-700 dark:text-teal-300">
            <PlugZap aria-hidden="true" className="size-3.5" />
            {t("heroEyebrow")}
          </div>
          <h1 className="font-heading text-3xl leading-tight tracking-tight text-balance sm:text-4xl">
            {t("heroTitle")}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            {t("heroDescription")}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button asChild>
              <a href="#integration-apps">
                {t("browseApps")}
                <ArrowRight aria-hidden="true" />
              </a>
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setTab("developer")}>
              {t("tabDeveloper")}
              <ArrowUpRight aria-hidden="true" className="size-4" />
            </Button>
            <Badge variant="outline" className="gap-1.5 text-xs">
              <PlugZap aria-hidden="true" className="size-3" />
              {t("sampleDataBadge")}
            </Badge>
          </div>
        </div>
      </section>

      <Tabs value={tab} onValueChange={(value) => setTab(value as string)}>
        <TabsList variant="line">
          <TabsTrigger value="apps">{t("tabApps")}</TabsTrigger>
          <TabsTrigger value="developer">{t("tabDeveloper")}</TabsTrigger>
        </TabsList>
        <TabsContent value="apps" className="pt-4">
          <AppsSection />
        </TabsContent>
        <TabsContent value="developer" className="pt-4">
          <IntegrationSection orgId={orgId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
