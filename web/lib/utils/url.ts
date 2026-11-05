const publicPagePatterns = [
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/licenses",
  "/product",
  "/features",
  "/pricing",
  "/security",
  "/about",
  "/careers",
  "/contact",
  "/guides",
  "/changelog",
  "/support",
  "/privacy",
  "/terms",
  "/dpa",
  "/~offline",
  "/manifest.webmanifest",
  "/manifest.json",
];

export function isProtectedPage(pathname: string): boolean {
  const path = pathname === "" ? "/" : pathname;
  return !publicPagePatterns.some((pattern) => path === pattern || path.startsWith(`${pattern}/`));
}
