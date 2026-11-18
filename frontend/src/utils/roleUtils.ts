import { ROUTES } from "@/constants/routes";
import type { User } from "@/types/auth";

export const ROLES = {
  CUSTOMER: "Customer",
  SELLER: "Seller",
  WAREHOUSE_MANAGER: "WarehouseManager",
  ADMIN: "Admin",
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_PRIORITY: readonly UserRole[] = [
  ROLES.ADMIN,
  ROLES.WAREHOUSE_MANAGER,
  ROLES.SELLER,
  ROLES.CUSTOMER,
];

export const ROLE_LABELS: Record<string, string> = {
  [ROLES.CUSTOMER]: "Khách hàng",
  [ROLES.SELLER]: "Người bán",
  [ROLES.WAREHOUSE_MANAGER]: "Quản lý kho",
  [ROLES.ADMIN]: "Quản trị viên",
};

export interface WorkspaceOption {
  key: string;
  label: string;
  path: string;
  role: UserRole;
}

type RoleBearingUser = Pick<User, "role" | "roles"> | null | undefined;

export function getUserRoles(user: RoleBearingUser): string[] {
  if (!user) return [];

  const collected = new Set<string>();
  if (Array.isArray(user.roles)) {
    for (const r of user.roles) {
      if (typeof r === "string" && r.trim()) {
        collected.add(r.trim());
      }
    }
  }

  if (typeof user.role === "string" && user.role.trim()) {
    collected.add(user.role.trim());
  }

  return Array.from(collected);
}

export function hasRole(
  user: RoleBearingUser,
  allowedRoles: string | readonly string[]
): boolean {
  const userRoles = getUserRoles(user);
  if (userRoles.length === 0) return false;

  const targets = typeof allowedRoles === "string" ? [allowedRoles] : allowedRoles;
  return targets.some((role) => userRoles.includes(role));
}

export function getPrimaryRole(user: RoleBearingUser): UserRole {
  const userRoles = getUserRoles(user);
  for (const role of ROLE_PRIORITY) {
    if (userRoles.includes(role)) {
      return role;
    }
  }
  return ROLES.CUSTOMER;
}

export function getDefaultRouteForUser(user: RoleBearingUser): string {
  const primaryRole = getPrimaryRole(user);
  switch (primaryRole) {
    case ROLES.ADMIN:
      return ROUTES.ADMIN;
    case ROLES.WAREHOUSE_MANAGER:
      return ROUTES.WAREHOUSE;
    case ROLES.SELLER:
      return ROUTES.SELLER;
    case ROLES.CUSTOMER:
    default:
      return ROUTES.HOME;
  }
}

export function getAvailableWorkspaces(user: RoleBearingUser): WorkspaceOption[] {
  const workspaces: WorkspaceOption[] = [
    {
      key: "storefront",
      label: "Sàn mua sắm",
      path: ROUTES.HOME,
      role: ROLES.CUSTOMER,
    },
  ];

  if (hasRole(user, ROLES.SELLER)) {
    workspaces.push({
      key: "seller",
      label: "Kênh người bán",
      path: ROUTES.SELLER,
      role: ROLES.SELLER,
    });
  }

  if (hasRole(user, ROLES.WAREHOUSE_MANAGER)) {
    workspaces.push({
      key: "warehouse",
      label: "Quản lý kho",
      path: ROUTES.WAREHOUSE,
      role: ROLES.WAREHOUSE_MANAGER,
    });
  }

  if (hasRole(user, ROLES.ADMIN)) {
    workspaces.push({
      key: "admin",
      label: "Trang quản trị",
      path: ROUTES.ADMIN,
      role: ROLES.ADMIN,
    });
  }

  return workspaces;
}

