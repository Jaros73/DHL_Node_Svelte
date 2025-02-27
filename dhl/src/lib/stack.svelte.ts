import { navigating } from "$app/stores";

interface StackState {
  create: string | number | undefined;
  export: boolean;
  filters: boolean;
  locations: boolean;
  remove: string | number | undefined;
  view: string | number | undefined;
}

class Stack {
  private stack = $state<StackState>({
    create: undefined,
    export: false,
    filters: false,
    locations: false,
    remove: undefined,
    view: undefined,
  });

  constructor() {
    navigating.subscribe((navigating) => {
      if (navigating?.from?.route !== navigating?.to?.route) {
        this.closeAll();
      }
    });
  }

  get isCreate() {
    return this.stack.create !== undefined;
  }

  get create() {
    return this.stack.create;
  }

  openCreate(id: string | number | undefined = "") {
    this.stack.create = id;
    this.stack.view = undefined;
  }

  closeCreate() {
    this.stack.create = undefined;
  }

  get isExport() {
    return this.stack.export;
  }

  openExport() {
    this.stack.export = true;
  }

  closeExport() {
    this.stack.export = false;
  }

  get isFilters() {
    return this.stack.filters;
  }

  openFilters() {
    this.stack.filters = true;
  }

  closeFilters() {
    this.stack.filters = false;
  }

  get isLocations() {
    return this.stack.locations;
  }

  openLocations() {
    this.stack.locations = true;
  }

  closeLocations() {
    this.stack.locations = false;
  }

  get isRemove() {
    return this.stack.remove !== undefined;
  }

  get remove() {
    return this.stack.remove;
  }

  openRemove(id: string | number) {
    this.stack.remove = id;
  }

  closeRemove() {
    this.stack.remove = undefined;
  }

  get isView() {
    return this.stack.view !== undefined;
  }

  get view() {
    return this.stack.view;
  }

  openView(id: string | number) {
    this.stack.view = id;
    this.stack.create = undefined;
  }

  closeView() {
    this.stack.view = undefined;
  }

  closeAll() {
    this.stack = {
      create: undefined,
      export: false,
      filters: false,
      locations: false,
      remove: undefined,
      view: undefined,
    };
  }
}

export let stack = new Stack();
