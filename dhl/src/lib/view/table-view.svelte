<script
  lang="ts"
  generics="ListItem extends { id: string | number }, SingleItem extends { id: string | number} = ListItem"
>
  import type { PaginatedClient } from "$lib/api/paginated-client.svelte";
  import Button from "$lib/components/button.svelte";
  import Divider from "$lib/components/divider.svelte";
  import ExportRangePicker from "$lib/components/export-range-picker.svelte";
  import Header from "$lib/components/header.svelte";
  import NextButton from "$lib/components/next-button.svelte";
  import SearchBar from "$lib/components/search-bar.svelte";
  import Table from "$lib/components/table.svelte";
  import { debounce } from "$lib/debounce";
  import { stack } from "$lib/stack.svelte";
  import { title as getTitle } from "$lib/title";
  import { faDownload, faPlus, faRotate } from "@fortawesome/free-solid-svg-icons";
  import type { Component, Snippet } from "svelte";

  interface TableViewProps {
    title: string;
    client: PaginatedClient<ListItem, SingleItem>;
    create?: Component;
    filters?: Component;
    view?: Component;
    remove?: Component;
    exportTitle?: string;
    noExport?: boolean;
    tableHeader?: Snippet;
    tableRow?: Snippet<
      [
        {
          item: ListItem;
          active: boolean;
          open(): void;
          clone(): void;
          remove(): void;
        },
      ]
    >;
  }

  let { title, client, create, filters, view, remove, exportTitle, noExport, tableHeader, tableRow }: TableViewProps =
    $props();
  client.find({
    filter: undefined,
    search: undefined,
  });

  let onsearch = debounce(300, (search: string) => client.find({ search }));
</script>

<svelte:head>
  <title>{getTitle(title)}</title>
</svelte:head>

<Header {title}>
  {#if !noExport}
    <Button onclick={() => stack.openExport()} icon={faDownload} variant="ghost">Export</Button>
  {/if}

  <Button onclick={() => client.refresh()} icon={faRotate} variant="ghost">Aktualizovat</Button>

  {#if create}
    <Button onclick={() => stack.openCreate()} icon={faPlus} variant="primary">Vytvořit</Button>
  {/if}
</Header>

<Divider />
<SearchBar {onsearch} noFilters={!filters} />
<Divider />

<Table>
  {#snippet head()}
    {@render tableHeader?.()}
  {/snippet}

  {#each client.items as item (item.id)}
    {@render tableRow?.({
      item,
      active: `${item.id}` === `${stack.view}`,
      open() {
        stack.openView(item.id);
      },
      clone() {
        stack.openCreate(item.id);
      },
      remove() {
        stack.openRemove(item.id);
      },
    })}
  {/each}
</Table>

<Divider />
<NextButton onclick={() => client.next()} hasNext={client.hasNext} />

{#if create && stack.isCreate}
  <svelte:component this={create} />
{/if}

{#if !noExport && stack.isExport}
  <ExportRangePicker fieldName={exportTitle} onexport={([from, to]) => client.export({ from, to })} />
{/if}

{#if filters && stack.isFilters}
  <svelte:component this={filters} />
{/if}

{#if view && stack.isView}
  <svelte:component this={view} />
{/if}

{#if remove && stack.isRemove}
  <svelte:component this={remove} />
{/if}
