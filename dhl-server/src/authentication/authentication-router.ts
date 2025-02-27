import { Router } from "express";
import { StatusCodes } from "http-status-codes";
import { DateTime } from "luxon";
import { IS_LOCAL_MOCK_ENABLED } from "../config";
import { context } from "../context";
import { NotFound, Unauthorized } from "../error/http-error";
import {
  TokenSet,
  oauthExchangeAuthorizationCode,
  oauthExchangeRefreshToken,
} from "../oauth/oauth-service";
import { requireAuthenticated } from "../security/authorization";
import { User } from "../security/user";
import { authenticationExchangeCodeSchema } from "./authentication-schema";
import {
  authenticationGetLoginUrl,
  authenticationGetRefreshToken,
  authenticationGetUser,
  authenticationMapRoleName,
  authenticationSet,
  authenticationUnset,
  authenticationUpsertUser,
  authenticationValidateIdToken,
} from "./authentication-service";

export function authenticationRouter() {
  let router = Router();

  router.get("/web/login", async (_, res) => {
    return res.redirect(StatusCodes.TEMPORARY_REDIRECT, authenticationGetLoginUrl());
  });

  router.get("/web/token", requireAuthenticated(), (_, res) => {
    let user = context(res).user;

    return res.json({
      id: user.id,
      givenName: user.givenName,
      surname: user.surname,
      fullName: user.fullName,
      roles: user.roles,
      locations: user.locations,
    });
  });

  router.post("/web/token", async (req, res) => {
    let refreshToken = authenticationGetRefreshToken(req);
    let body = await authenticationExchangeCodeSchema.parseAsync(req.body);

    if (IS_LOCAL_MOCK_ENABLED && body.code?.startsWith("local-")) {
      let userId = body.code.replace("local-", "");
      let user = await authenticationGetUser(userId);
      if (!user) {
        throw new NotFound();
      }

      return await authenticationSet(
        res,
        new User({
          ...user,
          locations: user.locations.reduce(
            (group, it) => {
              group[it.role] ??= [];
              group[it.role]!.push(it.locationId);

              return group;
            },
            {} as Record<string, string[]>,
          ),
        }),
        "local",
        DateTime.utc().plus({ days: 365 }).toUnixInteger(),
      );
    }

    let tokenSet: TokenSet | undefined;
    try {
      if (body.code) {
        tokenSet = await oauthExchangeAuthorizationCode(body.code);
      } else if (refreshToken) {
        tokenSet = await oauthExchangeRefreshToken(refreshToken);
      }
    } catch {
      throw new Unauthorized();
    }

    if (!tokenSet || !tokenSet.idToken || !tokenSet.refreshToken) {
      throw new Unauthorized();
    }

    let claims = await authenticationValidateIdToken(tokenSet.idToken);
    let user = await authenticationUpsertUser({
      id: claims.uid,
      givenName: claims.givenName,
      surname: claims.sn,
      roles: claims.nsRole.map(authenticationMapRoleName).filter((it): it is string => Boolean(it)),
    });
    if (!user) {
      throw new Unauthorized();
    }

    return await authenticationSet(
      res,
      new User({
        ...user,
        locations: user.locations.reduce(
          (group, it) => {
            group[it.role] ??= [];
            group[it.role]!.push(it.locationId);

            return group;
          },
          {} as Record<string, string[]>,
        ),
      }),
      tokenSet.refreshToken,
      DateTime.utc().plus({ seconds: tokenSet.expiresIn }).toUnixInteger(),
    );
  });

  router.post("/web/logout", (_, res) => {
    return authenticationUnset(res);
  });

  return router;
}
