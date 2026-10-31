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
];

export function isProtectedPage(pathname: string): boolean {
  const path = pathname === "" ? "/" : pathname;
  return !publicPagePatterns.some((pattern) => path === pattern || path.startsWith(`${pattern}/`));
}
