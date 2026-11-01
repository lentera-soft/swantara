const publicPagePatterns = [
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/licenses",
  "/product",
  "/pricing",
  "/about",
  "/contact",
  "/~offline",
  "/manifest.webmanifest",
  "/manifest.json",
];

export function isProtectedPage(pathname: string): boolean {
  const path = pathname === "" ? "/" : pathname;
  return !publicPagePatterns.some((pattern) => path === pattern || path.startsWith(`${pattern}/`));
}
