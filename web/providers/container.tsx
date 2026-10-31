import { ThemeHotkey } from "@/components/theme-hotkey";
import { Toaster } from "@/components/toast";
import { ThemeProvider } from "./theme";

export type ProviderContainer = {
  children: React.ReactNode;
};

export async function ProviderContainer({ children }: ProviderContainer) {
  return (
    <ThemeProvider>
      <ThemeHotkey />
      {children}
      <Toaster />
    </ThemeProvider>
  );
}
