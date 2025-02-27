import { RequestHandler } from "express";
import { authenticationGet } from "../authentication/authentication-service";
import { context } from "../context";

export function authentication(): RequestHandler {
  return async (req, res, next) => {
    let ctx = context(res);

    let user = await authenticationGet(req);
    if (!user) {
      return next();
    }

    ctx.user = user;
    
    return next();
  };
}
