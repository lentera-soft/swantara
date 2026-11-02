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
        className={cn("mx-auto flex w-full max-w-6xl flex-col justify-center sm:p-6", className)}
      >
        <div className="p-12 bg-white rounded flex gap-8 items-center border">
          <div className="flex-1">
            <div>
              <h1 className="font-heading text-3xl leading-snug">{title.trim()}</h1>
              <p className="text-sm text-muted-foreground">{subtitle.trim()}</p>
            </div>
            <div className="flex flex-col gap-4 mt-8">{children}</div>
          </div>
          <div className="flex-2"></div>
        </div>
      </div>
    </div>
  );
}
