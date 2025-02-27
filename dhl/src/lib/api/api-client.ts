import { ApiError } from "./api-error";

type UnauthorizedHandler = () => Promise<void>;

interface Payload {
  body: FormData | unknown;
}

class ApiClient {
  private unauthorizedHandler: UnauthorizedHandler | undefined;

  onUnauthorized(handler: UnauthorizedHandler | undefined) {
    this.unauthorizedHandler = handler;
  }

  async get<T>(path: string | URL) {
    return await this.request<T>(path);
  }

  async post<T>(path: string | URL, payload?: Payload) {
    return await this.request<T>(path, this.createRequestInit("POST", payload));
  }

  async put<T>(path: string | URL, payload?: Payload) {
    return await this.request<T>(path, this.createRequestInit("PUT", payload));
  }

  async patch<T>(path: string | URL, payload?: Payload) {
    return await this.request<T>(path, this.createRequestInit("PATCH", payload));
  }

  async delete<T>(path: string | URL) {
    return await this.request<T>(path, this.createRequestInit("DELETE"));
  }

  private async request<T>(input: RequestInfo | URL, init?: RequestInit, retryOnUnauthorized = true): Promise<T> {
    init ??= {};
    init.credentials ??= "same-origin";

    let res = await globalThis.fetch(input, init);
    if (res.status === 401 && retryOnUnauthorized && this.unauthorizedHandler) {
      await this.unauthorizedHandler();
      return this.request<T>(input, init, false);
    }

    let isJson = res.headers.get("content-type")?.includes("json");
    let data = isJson ? res.json() : res.text();
    if (res.status >= 400) {
      throw new ApiError(res.status, await data);
    }

    return (await data) as T;
  }

  private createRequestInit(method: string, payload?: Payload) {
    let init: RequestInit = { method };

    if (payload) {
      if (payload.body instanceof FormData) {
        init.body = payload.body;
      } else {
        init.body = JSON.stringify(payload.body);
        init.headers = {
          "content-type": "application/json",
        };
      }
    }

    return init;
  }
}

export let apiClient = new ApiClient();
