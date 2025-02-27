import { PaginatedClient } from "$lib/api/paginated-client.svelte";

interface EnumValue {
  id: number;
  name: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

export class EnumValuesClient extends PaginatedClient<EnumValue, EnumValue, {}, {}> {
  constructor(key: string) {
    super(`/api/enums/${key}`);
  }

  protected override singleItemToListItem(item: EnumValue): EnumValue {
    return item;
  }
}
