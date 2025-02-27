import { AccessTokenPayload } from "../authentication/authentication-service";
import { isAdminRole, toNormalRole } from "./role";

interface RawUser {
  id: string;
  givenName: string;
  surname: string;
  fullName?: string | null;
  roles: string[];
  locations: Record<string, string[]>;
}

export class User {
  readonly id: string;
  readonly givenName: string;
  readonly surname: string;
  readonly fullName: string;
  readonly roles: string[];
  readonly locations: Record<string, string[]>;
  readonly isAdmin: boolean;
  readonly adminOf: string[];

  constructor(data: RawUser) {
    this.id = data.id;
    this.givenName = data.givenName;
    this.surname = data.surname;
    this.fullName = data.fullName ?? `${data.givenName} ${data.surname}`;
    this.roles = data.roles;
    this.locations = data.locations;
    this.adminOf = data.roles.filter(isAdminRole).map(toNormalRole);
    this.isAdmin = this.adminOf.length > 0;
  }

  static fromTokenPayload(payload: AccessTokenPayload) {
    return new User({
      id: payload.sub,
      ...payload,
    });
  }

  canUseLocation(role: string, locationId: string) {
    return (
      this.adminOf.includes(role) ||
      (this.roles.includes(role) && this.locations[role]?.includes(locationId))
    );
  }

  canUseAnyLocation(role: string) {
    return (
      this.adminOf.includes(role) ||
      (this.roles.includes(role) && (this.locations[role]?.length ?? 0) > 0)
    );
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

  hasAnyLocation(role: string) {
    return (this.locations[role]?.length ?? 0) > 0;
  }
}
