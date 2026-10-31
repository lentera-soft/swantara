"use client";

import { useTranslations } from "next-intl";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/tabs";
import { OrganizationAdminSection } from "../../admin/_components/organization-admin-section";
import { SystemConfigSection } from "../../admin/_components/system-config-section";
import { MembersSection } from "../members/_components/members-section";

export function SettingsTabs({ orgId }: { orgId: string }) {
  const t = useTranslations("Settings");
  const tAdmin = useTranslations("Admin");

  return (
    <Tabs defaultValue="general">
      <TabsList variant="line">
        <TabsTrigger value="general">{t("profileTitle")}</TabsTrigger>
        <TabsTrigger value="members">{t("membersTitle")}</TabsTrigger>
        <TabsTrigger value="system">{tAdmin("systemConfigTitle")}</TabsTrigger>
      </TabsList>

      <TabsContent value="general" className="pt-4">
        <OrganizationAdminSection orgId={orgId} />
      </TabsContent>

      <TabsContent value="members" className="pt-4">
        <MembersSection />
      </TabsContent>

      <TabsContent value="system" className="pt-4">
        <SystemConfigSection orgId={orgId} />
      </TabsContent>
    </Tabs>
  );
}
