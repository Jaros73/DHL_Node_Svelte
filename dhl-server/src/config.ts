import { env } from "node:process";
import "dotenv/config";

function getenv(key: string, fallback = "") {
  return env[key] ?? fallback;
}

export const IS_DEV = getenv("APP_ENV") === "dev";

export const LOG_LEVEL = getenv("LOG_LEVEL", "info");

export const IS_LOCAL_MOCK_ENABLED = getenv("APP_LOCAL_MOCK") === "true";

export const APP_NAME = getenv("APP_NAME", "dhl");
export const APP_SECRET = getenv("APP_SECRET", "dhl-secret");

export const PORT = Number(getenv("PORT", "0"));
export const HOST = getenv("HOST", "0.0.0.0");

export const DB_URL = getenv("DB_URL");
export const PAGE_ROWS = Number(getenv("PAGE_ROWS", "50"));

export const ESB_USERNAME = getenv("ESB_USERNAME");
export const ESB_PASSWORD = getenv("ESB_PASSWORD");
export const ESB_URL = getenv("ESB_URL");
export const ESB_TTL_LOCATIONS = Number(getenv("ESB_TTL_LOCATIONS", "86400"));

export const AUTH_LOGIN_URL = getenv("AUTH_LOGIN_URL");
export const AUTH_CLIENT_ID = getenv("AUTH_CLIENT_ID");
export const AUTH_SECRET = getenv("AUTH_SECRET");
export const AUTH_REDIRECT_URL = getenv("AUTH_REDIRECT_URL");

export const JWKS_SIG_PATH = getenv("JWKS_SIG_PATH");
export const JWKS_ENC_PATH = getenv("JWKS_ENC_PATH");

export const UPLOAD_DESTINATION = getenv("UPLOAD_DESTINATION", "tmp");
export const UPLOAD_PERSIST = getenv("UPLOAD_PERSIST", "storage");
