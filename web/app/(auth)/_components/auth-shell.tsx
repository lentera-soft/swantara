import { Card, CardContent, CardHeader } from "@/components/card";
import { LocaleSwitcher } from "@/components/locale-switcher";

import { cn } from "@/lib/utils";

export type AuthShellProps = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
};

export default async function AuthShell({
  title,
  subtitle = "",
  children,
  className,
}: AuthShellProps) {
  return (
    <div data-slot="auth-shell" className="flex min-h-screen bg-muted/20">
      <div
        className={cn("mx-auto flex w-full max-w-lg flex-col justify-center p-4 sm:p-6", className)}
      >
        <Card>
          <CardHeader className="border-b">
            <h1 className="font-heading text-xl leading-snug">{title.trim()}</h1>
            <p className="text-sm text-muted-foreground">{subtitle.trim()}</p>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">{children}</CardContent>
        </Card>
      </div>
    </div>
  );
}
