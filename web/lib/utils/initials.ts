export function getInitials(name?: string | null): string {
  if (!name) return "";
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export const initials = getInitials;

export default getInitials;
