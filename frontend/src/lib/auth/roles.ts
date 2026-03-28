import type { User } from "@/contexts/AuthContext";

const CUSTOMER_ROLE_NAMES = new Set(["customer", "client"]);

export function getNormalizedRoleNames(user: User | null | undefined): string[] {
  return Array.from(
    new Set(
      [user?.role, ...(user?.roles ?? [])]
        .filter((role): role is string => typeof role === "string" && role.trim().length > 0)
        .map((role) => role.trim().toLowerCase()),
    ),
  );
}

export function isBackofficeUser(user: User | null | undefined): boolean {
  const roleNames = getNormalizedRoleNames(user);
  if (roleNames.length === 0) {
    return false;
  }

  return roleNames.some((role) => !CUSTOMER_ROLE_NAMES.has(role));
}