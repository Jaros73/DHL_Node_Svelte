import { PaginatedClient } from "$lib/api/paginated-client.svelte";

interface Remainder {
  id: number;
  createdAt: string;
  createdBy: string;
  updatedAt?: string;
  updatedBy?: string;
  locationId: string;
  dateFor: string;
  network: string;
  kind: string;
  technologicalGroup: string;
  amount: string;
  note?: string;
  createdByFullName: string;
  updatedByFullName?: string;
  locationName: string;
  technologicalGroupUnit: string;
  technologicalGroupGroup: string;
  crates: {
    crate: string;
    amount: number;
  }[];
}

interface RemainderMeta {
  locations: { id: string; name: string }[];
  crates: { value: string }[];
  technologicalGroups: {
    value: string;
    group: string;
    unit: string;
    crates: {
      crate: string;
    }[];
  }[];
}

interface RemainderFilter {
  createdAt?: [string | null | undefined, string | null | undefined] | undefined;
  locationId?: string[] | undefined;
  network?: string[] | undefined;
  kind?: string[] | undefined;
  technologicalGroup?: string[] | undefined;
}

class RemaindersClient extends PaginatedClient<Remainder, Remainder, RemainderMeta, RemainderFilter> {
  constructor() {
    super("/api/remainders");
  }

  protected override singleItemToListItem(item: Remainder): Remainder {
    return item;
  }
}

export let remaindersClient = new RemaindersClient();
