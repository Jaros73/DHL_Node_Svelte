import { ErrorRequestHandler } from "express";
import { context } from "../context";
import { errorToHttpError } from "./error-mapper";

export function errorHandler(): ErrorRequestHandler {
  return (err, _req, res, next) => {
    let httpError = errorToHttpError(err);
    context(res).logger.error({ err, httpError }, "thrown error");

    if (res.headersSent) {
      return next(httpError);
    }

    return res.status(httpError.status).json({
      message: httpError.message,
      detail: httpError.detail,
    });
  };
}
