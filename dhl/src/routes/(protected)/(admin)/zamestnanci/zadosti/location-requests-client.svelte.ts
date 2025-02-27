import { apiClient } from "$lib/api/api-client";
import type { Paginated } from "$lib/api/paginated-client.svelte";

interface LocationRequest {
  userId: string;
  locationId: string;
  locationName: string;
  role: string;
  timeRequested: string;
  userGivenName: string;
  userSurname: string;
}

export interface RequestLocationApproval {
  locationId: string;
  role: string;
  userId: string;
  action: "approve" | "reject";
}

class LocationRequestsClient {
  private response = $state<Paginated<LocationRequest>>({ items: [] });

  get items() {
    return this.response.items;
  }

  async find() {
    this.response = await apiClient.get<Paginated<LocationRequest>>("/api/locations/requests");
  }

  async update(payload: RequestLocationApproval[]) {
    await apiClient.patch<void>("/api/locations/requests", { body: payload });

    this.response.items = this.response.items.filter(
      (it) =>
        !payload.some(
          (entry) => it.userId === entry.userId && it.locationId === entry.locationId && it.role === entry.role,
        ),
    );
  }
}

export let locationRequestsClient = new LocationRequestsClient();
