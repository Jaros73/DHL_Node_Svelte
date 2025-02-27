import { PaginatedClient } from "$lib/api/paginated-client.svelte";

interface Machining {
  id: number;
  createdAt: string;
  createdBy: string;
  updatedAt?: string;
  updatedBy?: string;
  dateFor: string;
  locationId: string;
  createdByFullName: string;
  updatedByFullName?: string;
  locationName: string;
  machines: Array<{
    machine: string;
    value?: number;
    note?: string;
  }>;
}

interface MachiningMeta {
  locations: { id: string; name: string }[];
  machines: { value: string }[];
}

interface MachiningsFilter {
  dateFor?: [string | null | undefined, string | null | undefined] | undefined;
  locationId?: string[] | undefined;
}

class MachiningsClient extends PaginatedClient<Machining, Machining, MachiningMeta, MachiningsFilter> {
  constructor() {
    super("/api/machinings");
  }

  protected override singleItemToListItem(item: Machining): Machining {
    return item;
  }
}

export let machiningsClient = new MachiningsClient();
