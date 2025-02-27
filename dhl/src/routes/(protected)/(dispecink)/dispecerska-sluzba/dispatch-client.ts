import { PaginatedClient } from "$lib/api/paginated-client.svelte";

interface Dispatch {
  id: number;
  createdAt: string;
  createdBy: string;
  createdByFullName: string;
  updatedAt: string;
  updatedBy: string;
  updatedByFullName: string;
  userTime: string;
  locationId: string;
  locationName: string;
  typeEnumId: number;
  typeEnumName: string;
  keyEnumId: number;
  keyEnumName: string;
  description: string;
}

interface DispatchMeta {
  locations: { id: string; name: string }[];
  types: { id: number; name: string }[];
  keys: { id: number; name: string }[];
}

interface DispatchFilter {
  createdAt?: [string | null | undefined, string | null | undefined];
  locationId?: string[] | undefined;
  typeEnumId?: string[] | undefined;
  keyEnumId?: string[] | undefined;
}

class DispatchClient extends PaginatedClient<Dispatch, Dispatch, DispatchMeta, DispatchFilter> {
  constructor() {
    super("/api/dispatch");
  }

  protected override singleItemToListItem(item: Dispatch): Dispatch {
    return item;
  }
}

export let dispatchClient = new DispatchClient();
