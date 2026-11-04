"use client";

import { Building2, Check, ChevronsUpDown, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useSidebar } from "@/components/app-shell";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/dropdown";
import { useMeOrganizationsQuery } from "@/lib/hooks/use-me-query";
import { useOrganizationId } from "@/lib/hooks/use-org-context";
import { setActiveOrg } from "@/lib/server/active-org-actions";
import { cn } from "@/lib/utils";
import { CreateOrganizationDialog } from "./create-organization-dialog";

function getInitials(name?: string): string {
  if (!name) return "";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function OrgLogo({
  logo,
  name,
  className,
}: {
  logo?: string | null;
  name?: string;
  className?: string;
}) {
  const tOrg = useTranslations("Organization" as unknown as "Common");
  const tx = tOrg as unknown as (key: string, values?: Record<string, string>) => string;

  if (logo) {
    return (
      // biome-ignore lint/performance/noImgElement: org logo comes from the API
      <img
        src={logo}
        alt={name ? tx("logoAltWithName", { name }) : tx("logoAlt")}
        className={cn("size-8 shrink-0 rounded-lg object-cover", className)}
      />
    );
  }

  const initials = getInitials(name);
  if (initials) {
    return (
      <span
        aria-hidden
        className={cn(
          "grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-xs font-medium text-primary-foreground",
          className,
        )}
      >
        {initials}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "grid size-8 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary ring-1 ring-primary/30",
        className,
      )}
    >
      <Building2 className="size-4" aria-hidden />
    </span>
  );
}

export function OrgBrand() {
  const router = useRouter();
  const tOrg = useTranslations("Organization" as unknown as "Common");
  const tx = tOrg as unknown as (key: string) => string;
  const [createOpen, setCreateOpen] = useState(false);
  const { state, isMobile } = useSidebar();
  const collapsed = state === "collapsed" && !isMobile;
  const activeOrgId = useOrganizationId();
  const { data, isLoading } = useMeOrganizationsQuery();
  const organizations = (data?.organizations ?? []).filter((org): org is NonNullable<typeof org> =>
    Boolean(org),
  );

  const current = organizations.find((org) => org.id === activeOrgId) ?? organizations[0];

  const handleSelect = async (id: number) => {
    await setActiveOrg(id);
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={current?.name ?? tx("selectOrganization")}
            title={current?.name ?? tx("selectOrganization")}
            className={cn(
              "group/brand flex min-h-11 w-full items-center gap-2.5 rounded-lg p-2 text-left outline-none transition-colors hover:bg-sidebar-accent focus-visible:ring-3 focus-visible:ring-sidebar-ring/50",
              collapsed && "justify-center",
            )}
          >
            <OrgLogo logo={current?.logo} name={current?.name} />
            <span className={cn("flex min-w-0 flex-1 flex-col gap-0.5", collapsed && "sr-only")}>
              <span className="truncate text-sm">
                {current?.name ?? (isLoading ? "…" : tx("selectOrganization"))}
              </span>
              <span className="truncate text-xs text-muted-foreground">{tx("current")}</span>
            </span>
            <ChevronsUpDown
              className={cn("size-4 shrink-0 text-muted-foreground", collapsed && "sr-only")}
              aria-hidden
            />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="min-w-56" align="start">
          <DropdownMenuGroup>
            <DropdownMenuLabel>{tx("label")}</DropdownMenuLabel>
            {organizations.length === 0 ? (
              <DropdownMenuItem disabled>
                {isLoading ? tx("loading") : tx("empty")}
              </DropdownMenuItem>
            ) : (
              organizations.map((org) => {
                const isActive = org.id === current?.id;
                return (
                  <DropdownMenuItem
                    key={org.id}
                    onClick={() => handleSelect(org.id)}
                    data-active={isActive}
                  >
                    <OrgLogo
                      logo={org.logo}
                      name={org.name}
                      className={cn("size-6", isActive && "ring-1 ring-primary/30")}
                    />
                    <span className="flex-1 truncate">{org.name}</span>
                    {isActive ? <Check className="text-primary" /> : null}
                  </DropdownMenuItem>
                );
              })
            )}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              setCreateOpen(true);
            }}
          >
            <Plus />
            {tx("create")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <CreateOrganizationDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}
