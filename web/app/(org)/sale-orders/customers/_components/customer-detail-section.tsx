"use client";

import { Pencil } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ContactAddresses } from "@/app/(org)/contacts/_components/contact-addresses";
import { ContactBankAccounts } from "@/app/(org)/contacts/_components/contact-bank-accounts";
import { Badge } from "@/components/badge";
import { Button } from "@/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/card";
import { DetailPageSkeleton } from "@/components/detail-page-skeleton";
import { DetailsList } from "@/components/details-list";
import { RecordLayout } from "@/components/record-layout";
import { useContactQuery } from "@/lib/hooks/use-contact-query";
import { formatDate } from "@/lib/utils";
import { CustomerAvatar } from "./customer-avatar";
import { CustomerOrdersSection } from "./customer-orders-section";

const CUSTOMERS_HREF = "/sale-orders/customers";

export function CustomerDetail({ orgId, customerId }: { orgId: string; customerId: string }) {
  const t = useTranslations("Sales");
  const tc = useTranslations("Contacts");

  const numericCustomerId = Number(customerId);
  const validId = Number.isFinite(numericCustomerId) && numericCustomerId > 0;
  const contactQuery = useContactQuery(orgId, validId ? customerId : "");
  const contact = contactQuery.data;

  if (!validId || contactQuery.isPending) {
    return <DetailPageSkeleton />;
  }

  if (!contact?.isCustomer) {
    return <p className="text-sm text-muted-foreground">{t("customerNotFound")}</p>;
  }

  const displayName = contact.displayName ?? contact.name;

  const overview = (
    <div className="flex flex-col gap-4">
      <CustomerAvatar orgId={orgId} contact={contact} />
      <Card>
        <CardHeader>
          <CardTitle>{t("sectionIdentity")}</CardTitle>
          <CardDescription>{t("customersDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <DetailsList
            items={[
              { id: "name", label: tc("fieldName"), value: contact.name },
              {
                id: "displayName",
                label: t("fieldDisplayName"),
                value: contact.displayName || "—",
              },
              {
                id: "type",
                label: tc("fieldType"),
                value: contact.isOrganization ? tc("typeOrganization") : tc("typeIndividual"),
              },
              { id: "email", label: tc("fieldEmail"), value: contact.email || "—" },
              { id: "phone", label: tc("fieldPhone"), value: contact.phone || "—" },
              { id: "mobile", label: tc("fieldMobile"), value: contact.mobile || "—" },
              { id: "website", label: tc("fieldWebsite"), value: contact.website || "—" },
              { id: "taxId", label: tc("fieldTaxId"), value: contact.taxId || "—" },
              { id: "industry", label: tc("fieldIndustry"), value: contact.industry || "—" },
              { id: "currency", label: tc("fieldCurrency"), value: contact.currencyCode || "—" },
              { id: "lang", label: tc("fieldLanguage"), value: contact.lang || "—" },
              {
                id: "since",
                label: t("tableCustomerSince"),
                value: formatDate(contact.createdAt),
              },
            ]}
            layout="grid"
            columns={3}
          />
        </CardContent>
      </Card>
    </div>
  );

  const status = (
    <Badge variant={contact.active ? "default" : "outline"}>
      {contact.active ? t("statusActive") : t("statusDormant")}
    </Badge>
  );

  return (
    <RecordLayout
      breadcrumbItems={[
        { label: t("customersTitle"), href: CUSTOMERS_HREF },
        { label: displayName },
      ]}
      title={displayName}
      description={contact.isOrganization ? contact.name : undefined}
      status={status}
      actions={
        <Button size="sm" variant="outline" asChild>
          <Link href={`/sale-orders/customers/${customerId}/edit`}>
            <Pencil />
            <span>{tc("edit")}</span>
          </Link>
        </Button>
      }
      tabs={[
        { id: "overview", label: tc("tabOverview"), content: overview },
        {
          id: "orders",
          label: t("tabOrders"),
          content: <CustomerOrdersSection orgId={orgId} customerId={customerId} />,
        },
        {
          id: "addresses",
          label: tc("tabAddresses"),
          content: (
            <ContactAddresses
              orgId={orgId}
              contactId={customerId}
              onRefetch={() => void contactQuery.refetch()}
            />
          ),
        },
        {
          id: "bank-accounts",
          label: tc("tabBankAccounts"),
          content: (
            <ContactBankAccounts
              orgId={orgId}
              contactId={customerId}
              onRefetch={() => void contactQuery.refetch()}
            />
          ),
        },
      ]}
    />
  );
}
