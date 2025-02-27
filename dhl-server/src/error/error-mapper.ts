import { StatusCodes, getReasonPhrase } from "http-status-codes";
import { NoResultError } from "kysely";
import { ZodError } from "zod";
import { ConversionError } from "../helpers/number";
import { HttpError, InternalServerError, NotFound, UnprocessableEntity } from "./http-error";

export function errorToHttpError(err: Error): HttpError {
  if (err instanceof HttpError) {
    return err;
  }

  if (err instanceof ConversionError) {
    return new NotFound();
  }

  if (err instanceof NoResultError) {
    return new NotFound();
  }

  if (err instanceof ZodError) {
    return new UnprocessableEntity(err.issues);
  }

  return new InternalServerError(
    undefined,
    err.message ?? getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR),
    err,
  );
}
