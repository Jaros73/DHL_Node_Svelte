import { apiClient } from "$lib/api/api-client";
import { EnumValuesClient } from "./enum-values-client";

class EnumsClient {
  private response = $state<string[]>([]);
  private valueClients = new Map<string, EnumValuesClient>();

  get items() {
    return this.response;
  }

  async find() {
    this.response = await apiClient.get<string[]>("/api/enums");
  }

  values(key: string) {
    if (!this.valueClients.has(key)) {
      this.valueClients.set(key, new EnumValuesClient(key));
    }

    return this.valueClients.get(key)!;
  }
}

export let enumsClient = new EnumsClient();
