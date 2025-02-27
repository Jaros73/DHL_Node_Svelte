import { RequestHandler } from "express";
import { context } from "../context";
import { Unauthorized } from "../error/http-error";
import { Role } from "./role";
import { User } from "./user";

function checkAuth(user: User | undefined, predicate?: (user: User) => boolean) {
  if (!user) {
    return false;
  }

  return predicate?.(user) ?? true;
}

export function requireAuthenticated(): RequestHandler {
  return (_, res, next) => {
    if (!checkAuth(context(res).user)) {
      throw new Unauthorized();
    }

    return next();
  };
}

export function requireAdmin(): RequestHandler {
  return (_, res, next) => {
    if (!checkAuth(context(res).user, (user) => user.isAdmin)) {
      throw new Unauthorized();
    }

    return next();
  };
}

export function requireRole(role: Role | Role[]): RequestHandler {
  let roles = Array.isArray(role) ? role : [role];

  return (_, res, next) => {
    if (!checkAuth(context(res).user, (user) => roles.some((role) => user.hasRole(role)))) {
      throw new Unauthorized();
    }

    return next();
  };
}
