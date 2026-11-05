import { ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SwissIndexBadge } from "@/app/(marketing)/_components/swiss-grid-mark";
import thirdPartyNotices from "@/content/third-party-notices.json";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Licenses");
  const title = t("title");
  const description = t("description");

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
    },
    alternates: {
      languages: {
        en: "/licenses",
        id: "/licenses",
      },
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function LicensesPage() {
  const t = await getTranslations("Licenses");

  return (
    <main
      id="main"
      data-slot="licenses-page"
      className="min-h-screen bg-background text-foreground"
    >
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 bg-muted/20 px-6 py-4 sm:px-10">
          <SwissIndexBadge index="01" label="OPEN SOURCE // SPECIFICATION" />
          <span className="font-mono text-xs text-muted-foreground tabular-nums">
            {t("generated", { date: thirdPartyNotices.generatedAt })}
          </span>
        </div>

        <div className="grid grid-cols-1 divide-y divide-border/70 border-b border-border/70 lg:grid-cols-12 lg:divide-x lg:divide-y-0">
          <div className="p-6 sm:p-10 lg:col-span-7 lg:p-14">
            <h1 className="text-4xl font-semibold tracking-[-0.035em] leading-[1.05] sm:text-5xl">
              {t("title")}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              {t("description")}
            </p>
          </div>

          <div className="flex flex-col justify-between gap-6 p-6 sm:p-10 lg:col-span-5 lg:p-12">
            <p className="font-mono text-xs leading-relaxed text-muted-foreground">
              {t("summary", {
                npm: thirdPartyNotices.npmCount,
                go: thirdPartyNotices.goCount,
              })}
            </p>
            <div>
              <a
                href={thirdPartyNotices.fullNoticesUrl}
                className="inline-flex min-h-[44px] items-center gap-2 border border-border px-4 py-2 font-mono text-xs font-semibold tracking-wider text-foreground uppercase transition-colors hover:bg-muted/30"
              >
                <span>{t("viewFull")}</span>
                <ArrowUpRight aria-hidden="true" className="size-4" />
              </a>
            </div>
          </div>
        </div>

        <div className="divide-y divide-border/70">
          {thirdPartyNotices.licenseGroups.map((group, index) => (
            <section key={group.license} className="p-6 sm:p-10">
              <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border pb-4">
                <h2 className="text-lg font-semibold tracking-tight sm:text-xl">
                  {t("groupTitle", {
                    license: group.license,
                    count: group.packages.length,
                  })}
                </h2>
                <span className="font-mono text-xs text-primary tabular-nums">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>

              <ul className="mt-4 grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
                {group.packages.map((pkg) => (
                  <li
                    key={pkg}
                    className="truncate font-mono text-xs text-muted-foreground tabular-nums"
                  >
                    {pkg}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
