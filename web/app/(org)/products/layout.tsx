export default async function ProductsLayout({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-4 sm:gap-6">{children}</div>;
}
