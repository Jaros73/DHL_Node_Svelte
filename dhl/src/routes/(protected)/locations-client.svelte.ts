import { apiClient } from "$lib/api/api-client";
import { PaginatedClient, type Paginated } from "$lib/api/paginated-client.svelte";

interface Location {
  id: string;
  zip: string;
  name: string;
  region: string;
  regionOrg: string;
  spuName?: string;
  postOfficeType: string;
}

interface LocationRequest {
  locationId: string;
  role: string;
  timeRequested: string;
}

class LocationsClient extends PaginatedClient<Location, Location> {
  constructor() {
    super("/api/locations");
  }

  protected override singleItemToListItem(item: Location): Location {
    return item;
  }

  async requestLocation(role: string, locationId: string) {
    return await apiClient.post<LocationRequest>("/api/locations/me/requests", { body: { role, locationId } });
  }

  async revokeRequest(role: string, locationId: string) {
    return await apiClient.delete<void>(`/api/locations/me/requests/${role}/${locationId}`);
  }

  getLiveLocations() {
    let response = $state<Paginated<LocationRequest>>({ items: [] });

    apiClient.get<Paginated<LocationRequest>>("/api/locations/me").then((res) => {
      response = res;
    });

    return {
      get items() {
        return response.items;
      },
    };
  }

  getLocationRequests() {
    let response = $state<Paginated<LocationRequest>>({ items: [] });

    apiClient.get<Paginated<LocationRequest>>("/api/locations/me/requests").then((res) => {
      response = res;
    });

    return {
      get items() {
        return response.items;
      },
    };
  }
}

export let locationsClient = new LocationsClient();
