const DEFAULT_PERMISSIONS: Record<string, string[]> = {
  admin: [
    "org:manage",
    "org:settings",
    "org:billing",
    "org:audit",
    "member:manage",
    "member:invite",
    "team:manage",
    "department:manage",
    "course:manage",
    "batch:manage",
    "assignment:manage",
    "assessment:manage",
    "report:view",
    "sso:manage",
  ],
  instructor: [
    "batch:manage",
    "assignment:manage",
    "assessment:manage",
    "report:view",
    "member:view",
    "team:view",
  ],
  member: [
    "course:view",
    "assignment:submit",
    "assessment:take",
    "team:view",
  ],
};

export type Permission =
  | "org:manage"
  | "org:settings"
  | "org:billing"
  | "org:audit"
  | "member:manage"
  | "member:invite"
  | "member:view"
  | "team:manage"
  | "team:view"
  | "department:manage"
  | "course:manage"
  | "course:view"
  | "batch:manage"
  | "assignment:manage"
  | "assignment:submit"
  | "assessment:manage"
  | "assessment:take"
  | "report:view"
  | "sso:manage";

export type OrgRole = "admin" | "instructor" | "member";

export function getDefaultPermissions(role: OrgRole): string[] {
  return DEFAULT_PERMISSIONS[role] || [];
}

export function hasPermission(
  userPermissions: string[],
  requiredPermission: Permission
): boolean {
  return userPermissions.includes(requiredPermission);
}

export function hasAnyPermission(
  userPermissions: string[],
  requiredPermissions: Permission[]
): boolean {
  return requiredPermissions.some((p) => userPermissions.includes(p));
}

export function hasAllPermissions(
  userPermissions: string[],
  requiredPermissions: Permission[]
): boolean {
  return requiredPermissions.every((p) => userPermissions.includes(p));
}

export function canManageOrganization(permissions: string[]): boolean {
  return permissions.includes("org:manage");
}

export function canManageMembers(permissions: string[]): boolean {
  return permissions.includes("member:manage");
}

export function canManageBilling(permissions: string[]): boolean {
  return permissions.includes("org:billing");
}

export function canViewAudit(permissions: string[]): boolean {
  return permissions.includes("org:audit");
}

export function canManageSSO(permissions: string[]): boolean {
  return permissions.includes("sso:manage");
}

export function canManageTeams(permissions: string[]): boolean {
  return permissions.includes("team:manage");
}

export function canManageBatches(permissions: string[]): boolean {
  return permissions.includes("batch:manage");
}

export function canManageAssignments(permissions: string[]): boolean {
  return permissions.includes("assignment:manage");
}

export function canViewReports(permissions: string[]): boolean {
  return permissions.includes("report:view");
}