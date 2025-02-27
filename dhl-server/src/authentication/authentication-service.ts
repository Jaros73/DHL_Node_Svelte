import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { JWTPayload, SignJWT, compactDecrypt, createLocalJWKSet, importJWK, jwtVerify } from "jose";
import { sql } from "kysely";
import { jsonArrayFrom } from "kysely/helpers/postgres";
import { DateTime } from "luxon";
import { readFile } from "node:fs/promises";
import {
  APP_NAME,
  APP_SECRET,
  AUTH_CLIENT_ID,
  AUTH_LOGIN_URL,
  AUTH_REDIRECT_URL,
  IS_DEV,
  JWKS_ENC_PATH,
  JWKS_SIG_PATH,
} from "../config";
import { database } from "../database";
import { User } from "../security/user";

const AT_COOKIE = "at";
const RT_COOKIE = "rt";
const SECRET = new TextEncoder().encode(APP_SECRET);

const ENCRYPTION_KEY = new Promise<Awaited<ReturnType<typeof importJWK>>>(async (resolve) => {
  let jwks = JSON.parse(await readFile(JWKS_ENC_PATH, "utf-8"));
  let key = jwks.keys[0];
  return resolve(await importJWK(key));
});

const SIGNATURE_KEY = new Promise<ReturnType<typeof createLocalJWKSet>>(async (resolve) => {
  let jwks = JSON.parse(await readFile(JWKS_SIG_PATH, "utf-8"));
  return resolve(createLocalJWKSet(jwks));
});

export interface AccessTokenPayload {
  [key: string]: unknown;

  sub: string;
  givenName: string;
  surname: string;
  fullName: string;
  roles: string[];
  locations: Record<string, string[]>;
}

interface IdTokenPayload extends JWTPayload {
  uid: string;
  givenName: string;
  sn: string;
  nsRole: string[];
}

interface AuthenticationUpsertUserSchema {
  id: string;
  givenName: string;
  surname: string;
  roles: string[];
}

export function authenticationGetLoginUrl() {
  let url = new URL(AUTH_LOGIN_URL);
  url.searchParams.set("client_id", AUTH_CLIENT_ID);
  url.searchParams.set("redirect_uri", AUTH_REDIRECT_URL);
  url.searchParams.set("response_type", "code");

  return url.toString();
}

export async function authenticationGetUser(id: string) {
  return await database()
    .selectFrom("user")
    .selectAll("user")
    .select(({ selectFrom }) => [
      jsonArrayFrom(
        selectFrom("userLocation")
          .select(["userLocation.locationId", "userLocation.role"])
          .whereRef("userLocation.userId", "=", "user.id")
          .whereRef("user.roles", "&&", ({ ref }) => sql`array[${ref("userLocation.role")}]`),
      ).as("locations"),
    ])
    .where("user.id", "=", id)
    .executeTakeFirst();
}

export async function authenticationUpsertUser(user: AuthenticationUpsertUserSchema) {
  let { id } = await database()
    .insertInto("user")
    .values(user)
    .returning("id")
    .onConflict((oc) =>
      oc.column("id").doUpdateSet(({ ref }) => ({
        givenName: ref("excluded.givenName"),
        surname: ref("excluded.surname"),
        roles: ref("excluded.roles"),
      })),
    )
    .executeTakeFirstOrThrow();

  return await authenticationGetUser(id);
}

export async function authenticationValidateIdToken(idToken: string) {
  let { plaintext } = await compactDecrypt(idToken, await ENCRYPTION_KEY);
  let { payload } = await jwtVerify(plaintext, await SIGNATURE_KEY, {
    audience: [AUTH_CLIENT_ID],
  });

  return {
    ...payload,
    nsRole: payload["nsRole"] ?? [],
  } as IdTokenPayload;
}

export async function authenticationSet(
  res: Response,
  user: User,
  refreshToken: string,
  expiresIn: number,
) {
  let accessToken = await new SignJWT({
    sub: user.id,
    givenName: user.givenName,
    surname: user.surname,
    fullName: user.fullName,
    roles: user.roles,
    locations: user.locations,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(APP_NAME)
    .setAudience([APP_NAME])
    .setExpirationTime(expiresIn)
    .sign(SECRET);

  return res
    .cookie(AT_COOKIE, accessToken, {
      maxAge: expiresIn * 1000,
      path: "/api",
      sameSite: "strict",
      httpOnly: true,
      secure: !IS_DEV,
    })
    .cookie(RT_COOKIE, refreshToken, {
      maxAge: DateTime.utc().plus({ days: 180 }).toUnixInteger(),
      path: "/api/auth/web/token",
      sameSite: "strict",
      httpOnly: true,
      secure: !IS_DEV,
    })
    .json(user);
}

export async function authenticationGet(req: Request) {
  let accessToken = req.cookies[AT_COOKIE] as string | undefined;
  if (!accessToken) {
    return null;
  }

  try {
    let { payload } = await jwtVerify(accessToken, SECRET, {
      issuer: APP_NAME,
      audience: [APP_NAME],
    });
    return User.fromTokenPayload(payload as AccessTokenPayload);
  } catch {
    return null;
  }
}

export function authenticationGetRefreshToken(req: Request) {
  return req.cookies[RT_COOKIE] as string | undefined;
}

export function authenticationUnset(res: Response) {
  return res
    .clearCookie(AT_COOKIE, {
      path: "/api",
      sameSite: "strict",
      httpOnly: true,
      secure: !IS_DEV,
    })
    .clearCookie(RT_COOKIE, {
      path: "/api/auth/web/token",
      sameSite: "strict",
      httpOnly: true,
      secure: !IS_DEV,
    })
    .status(StatusCodes.NO_CONTENT)
    .end();
}

export function authenticationMapRoleName(dn: string) {
  return dn.split(",")?.[0]?.split("=")?.[1]?.replace("dhl_", "");
}
