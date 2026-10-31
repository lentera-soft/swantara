"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/table";
import { useOrgListQuery } from "@/lib/hooks/use-org-query";
import type { JournalEntry, ListQuery } from "@/lib/services/swantara";
import { getSwantaraService } from "@/lib/services/swantara";
import { formatDate } from "@/lib/utils";

export function RecentEntries() {
  const t = (
    useTranslations as unknown as (
      ns: string,
    ) => (key: string, values?: Record<string, string | number>) => string
  )("Accounting");

  const entriesQuery = useOrgListQuery<{ movements: JournalEntry[] }, ListQuery>(
    "recentJournalEntries",
    (organizationId, params) => getSwantaraService().journalEntries.list(organizationId, params),
    { size: 6, sort: "date:desc" },
  );

  const entries = entriesQuery.data?.movements ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("recentEntriesTitle")}</CardTitle>
        <CardDescription>{t("recentEntriesDescription")}</CardDescription>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("journalEntriesEmpty")}</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("colDate")}</TableHead>
                <TableHead>{t("colDescription")}</TableHead>
                <TableHead className="text-right">{t("colStatus")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="text-muted-foreground">{formatDate(entry.date)}</TableCell>
                  <TableCell>{entry.name ?? entry.ref ?? `#${entry.id}`}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline" className="text-xs">
                      {entry.state}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
