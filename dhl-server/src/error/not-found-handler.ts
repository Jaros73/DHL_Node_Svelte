import { RequestHandler } from "express";
import { NotFound } from "./http-error";

export function notFoundHandler(): RequestHandler {
  return (req) => {
    throw new NotFound({
      method: req.method,
      path: req.originalUrl,
    });
  };
}
