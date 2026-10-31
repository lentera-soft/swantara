import type { Metadata } from "next";
import { AppLauncher } from "./_components/app-launcher";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function AppsPage() {
  return <AppLauncher />;
}
