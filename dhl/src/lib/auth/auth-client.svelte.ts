import { apiClient } from "../api/api-client";
import { Identity, type Account } from "./identity";

class AuthClient {
  private currentIdentity = $state<Identity>();

  get identity() {
    return this.currentIdentity!;
  }

  private setIdentity(account: Account) {
    this.currentIdentity = new Identity(account);
    apiClient.onUnauthorized(async () => {
      await this.refresh();
    });
  }

  private unsetIdentity() {
    this.currentIdentity = undefined;
    apiClient.onUnauthorized(undefined);
  }

  async initialize() {
    return (await this.resolveUser()) || (await this.refresh());
  }

  async resolveUser() {
    try {
      let res = await apiClient.get<Account>("/api/auth/web/token");
      this.setIdentity(res);

      return true;
    } catch {
      return false;
    }
  }

  async authenticate(code: string) {
    try {
      let res = await apiClient.post<Account>("/api/auth/web/token", { body: { code } });
      this.setIdentity(res);

      return true;
    } catch {
      return false;
    }
  }

  async refresh() {
    try {
      let res = await apiClient.post<Account>("/api/auth/web/token");
      this.setIdentity(res);

      return true;
    } catch {
      return false;
    }
  }

  async logout() {
    try {
      await apiClient.post("/api/auth/web/logout");
    } finally {
      this.unsetIdentity();
    }
  }
}

export let authClient = new AuthClient();
