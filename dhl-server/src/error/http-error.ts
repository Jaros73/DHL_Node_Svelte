import { StatusCodes, getReasonPhrase } from "http-status-codes";

export class HttpError extends Error {
  constructor(
    readonly status = StatusCodes.INTERNAL_SERVER_ERROR,
    readonly detail?: unknown,
    message?: string,
    cause?: unknown,
  ) {
    super(message ?? getReasonPhrase(status), cause ? { cause } : undefined);
  }
}

export class Unauthorized extends HttpError {
  constructor(detail?: unknown, message?: string, cause?: unknown) {
    super(StatusCodes.UNAUTHORIZED, detail, message, cause);
  }
}

export class Forbidden extends HttpError {
  constructor(detail?: unknown, message?: string, cause?: unknown) {
    super(StatusCodes.FORBIDDEN, detail, message, cause);
  }
}

export class NotFound extends HttpError {
  constructor(detail?: unknown, message?: string, cause?: unknown) {
    super(StatusCodes.NOT_FOUND, detail, message, cause);
  }
}

export class Conflict extends HttpError {
  constructor(detail?: unknown, message?: string, cause?: unknown) {
    super(StatusCodes.CONFLICT, detail, message, cause);
  }
}

export class UnprocessableEntity extends HttpError {
  constructor(detail?: unknown, message?: string, cause?: unknown) {
    super(StatusCodes.UNPROCESSABLE_ENTITY, detail, message, cause);
  }
}

export class InternalServerError extends HttpError {
  constructor(detail?: unknown, message?: string, cause?: unknown) {
    super(StatusCodes.INTERNAL_SERVER_ERROR, detail, message, cause);
  }
}

export class NotImplemented extends HttpError {
  constructor(detail?: unknown, message?: string, cause?: unknown) {
    super(StatusCodes.INTERNAL_SERVER_ERROR, detail, message, cause);
  }
}
