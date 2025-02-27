export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly response?: { message: string; detail: unknown },
  ) {
    super(`Received error response from api: ${status}`);
  }
}
