import { randomUUID } from "node:crypto";
import { StatusCodes } from "http-status-codes";
import { APP_NAME, AUTH_CLIENT_ID, AUTH_REDIRECT_URL, AUTH_SECRET, ESB_URL } from "../config";
import { esbRequest } from "../esb/esb-request";

export interface TokenSet {
  accessToken?: string;
  idToken?: string;
  refreshToken?: string;
  tokenType?: string;
  expiresIn?: number;
  scope?: string;
}

export async function oauthExchangeAuthorizationCode(code: string) {
  let res = await esbRequest(`${ESB_URL}/authservice/api/v1/oauth/accessToken`, {
    headers: {
      "x-request-id": randomUUID(),
      clientId: AUTH_CLIENT_ID,
      clientSecret: AUTH_SECRET,
      sourceSys: APP_NAME,
      redirectUrl: AUTH_REDIRECT_URL,
      code,
    },
  });

  if (res.statusCode !== StatusCodes.OK) {
    throw new Error(`Received non-OK response: ${res.statusCode}`);
  }

  return JSON.parse(res.body) as TokenSet;
}

export async function oauthExchangeRefreshToken(refreshToken: string) {
  let res = await esbRequest(`${ESB_URL}/authservice/api/v1/oauth/refreshToken`, {
    headers: {
      "x-request-id": randomUUID(),
      clientId: AUTH_CLIENT_ID,
      clientSecret: AUTH_SECRET,
      sourceSys: APP_NAME,
      redirectUrl: AUTH_REDIRECT_URL,
      refreshToken,
    },
  });

  if (res.statusCode !== StatusCodes.OK) {
    throw new Error(`Received non-OK response: ${res.statusCode}`);
  }

  return JSON.parse(res.body) as TokenSet;
}
