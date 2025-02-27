const ADMIN_ROLE_SUFFIX = "_admin";

export enum Role {
  Dispecink = "dispecink",
  RegLogistika = "reglogistika",
}

export function isAdminRole(role: string) {
  return role.endsWith(ADMIN_ROLE_SUFFIX);
}

export function toNormalRole(role: string) {
  return role.replaceAll(ADMIN_ROLE_SUFFIX, "");
}
