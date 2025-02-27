import { apiClient } from "./api-client";

interface Find<Filter> {
  search?: string | undefined;
  filter?: Filter | undefined;
}

interface ItemWithId {
  id: string | number;
}

interface DateTimeRange {
  from: string;
  to: string;
}

export interface Paginated<Item> {
  items: Item[];
  next?: string;
}

export abstract class PaginatedClient<
  ListItem extends ItemWithId = { id: string | number },
  SingleItem extends ItemWithId = ListItem,
  Meta = unknown,
  Filter = unknown,
> {
  private response = $state<Paginated<ListItem>>({ items: [] });
  private query: Find<Filter> = {};

  get items() {
    return this.response.items;
  }

  get hasNext() {
    return Boolean(this.response.next);
  }

  get search() {
    return this.query.search;
  }

  get filter() {
    return this.query.filter;
  }

  constructor(protected readonly basePath: string) {}

  private async load() {
    let url = new URL(this.basePath, globalThis.location.origin);

    if (this.response.next) {
      url.searchParams.set("cursor", this.response.next);
    }

    if (this.query.search) {
      url.searchParams.set("search", this.query.search);
    }

    if (this.query.filter) {
      url.searchParams.set("filter", JSON.stringify(this.query.filter));
    }

    return await apiClient.get<Paginated<ListItem>>(url.toString());
  }

  meta() {
    let meta = $state<Meta>();

    apiClient.get<Meta>(`${this.basePath}/meta`).then((res) => {
      meta = res;
    });

    return {
      get value() {
        return meta;
      },
    };
  }

  async export(range: DateTimeRange) {
    let url = new URL(`${this.basePath}/export`, globalThis.location.origin);
    url.searchParams.set("from", range.from);
    url.searchParams.set("to", range.to);

    try {
      globalThis.window.open(url.toString());
      return true;
    } catch {
      return false;
    }
  }

  async find(find: Find<Filter> = {}) {
    this.query.search = "search" in find ? find.search : this.query.search;
    this.query.filter = "filter" in find ? find.filter : this.query.filter;
    this.response.next = undefined;

    this.response = await this.load();
  }

  async refresh() {
    this.response.next = undefined;

    this.response = await this.load();
  }

  async next() {
    if (!this.hasNext) {
      return;
    }

    let res = await this.load();
    this.response = {
      items: this.response.items.concat(res.items),
      next: res.next,
    };
  }

  addOrReplace(item: ListItem) {
    let ix = this.response.items.findIndex((it) => it.id === item.id);
    if (ix > -1) {
      this.response.items.splice(ix, 1, item);
    } else {
      this.response.items.unshift(item);
    }
  }

  item(id: ListItem["id"]) {
    return this.response.items.find((it) => it.id === id);
  }

  remove(id: ListItem["id"]) {
    let ix = this.response.items.findIndex((it) => it.id === id);
    if (ix > -1) {
      this.response.items.splice(ix, 1);
    }
  }

  get(id: SingleItem["id"]) {
    let item = $state<SingleItem>();

    apiClient.get<SingleItem>(`${this.basePath}/${id}`).then((res) => {
      item = res;
    });

    return {
      get value() {
        return item;
      },
    };
  }

  async create<Payload = unknown>(payload: Payload): Promise<SingleItem> {
    let res = await apiClient.post<SingleItem>(this.basePath, { body: payload });
    this.addOrReplace(this.singleItemToListItem(res));

    return res;
  }

  async update<Payload = unknown>(id: SingleItem["id"], payload: Payload): Promise<SingleItem> {
    let res = await apiClient.put<SingleItem>(`${this.basePath}/${id}`, { body: payload });
    this.addOrReplace(this.singleItemToListItem(res));

    return res;
  }

  async delete(id: SingleItem["id"]) {
    await apiClient.delete(`${this.basePath}/${id}`);

    this.remove(id);
  }

  protected abstract singleItemToListItem(item: SingleItem): ListItem;
}
