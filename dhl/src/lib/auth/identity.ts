export interface Account {
  id: string;
  givenName: string;
  surname: string;
  fullName: string;
  roles: string[];
  locations: Record<string, string[]>;
}

export class Identity {
  readonly id: string;
  readonly givenName: string;
  readonly surname: string;
  readonly fullName: string;
  readonly initials: string;
  readonly roles: string[];
  readonly locations: Record<string, string[]>;
  readonly isAdmin: boolean;
  readonly adminOf: string[];

  constructor(payload: Account) {
    this.id = payload.id;
    this.givenName = payload.givenName;
    this.surname = payload.surname;
    this.fullName = payload.fullName ?? `${payload.givenName} ${payload.surname}`;
    this.initials = `${payload.givenName[0]}${payload.surname[0]}`;
    this.roles = payload.roles;
    this.locations = payload.locations;
    this.adminOf = payload.roles.filter((it) => it.endsWith("_admin")).map((it) => it.replaceAll("_admin", ""));
    this.isAdmin = this.adminOf.length > 0;
  }

  canUseLocation(role: string, locationId: string) {
    return this.adminOf.includes(role) || (this.roles.includes(role) && this.locations[role]?.includes(locationId));
  }

  canUseAnyLocation(role: string) {
    return this.adminOf.includes(role) || (this.roles.includes(role) && (this.locations[role]?.length ?? 0) > 0);
  }

  isAdminOf(role: string) {
    return this.adminOf.includes(role);
  }

  hasRole(role: string) {
    return this.roles.some((it) => it.startsWith(role));
  }

  hasLocation(role: string, locationId: string) {
    return this.locations[role]?.includes(locationId);
  }

  hasRoleWithLocation(role: string, locationId: string) {
    return this.roles.some((it) => it.startsWith(role)) && this.locations[role]?.includes(locationId);
  }

  hasAnyLocation(role: string) {
    return (this.locations[role]?.length ?? 0) > 0;
  }

  hasRoleWithAnyLocation(role: string) {
    return this.roles.some((it) => it.startsWith(role)) && (this.locations[role]?.length ?? 0) > 0;
  }
}
