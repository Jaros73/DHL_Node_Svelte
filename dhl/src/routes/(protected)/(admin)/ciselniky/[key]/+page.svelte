<script lang="ts">
  import { page } from "$app/stores";
  import Badge from "$lib/components/badge.svelte";
  import TableRowWithActions from "$lib/components/table-row-with-actions.svelte";
  import Text from "$lib/components/text.svelte";
  import { formatDate } from "$lib/format";
  import { resource } from "$lib/resource";
  import TableView from "$lib/view/table-view.svelte";
  import { enumsClient } from "../enums-client.svelte";
  import EnumValuesCreate from "./enum-values-create.svelte";
  import { default as EnumValuesRemove } from "./enum-values-remove.svelte";
  import EnumValuesView from "./enum-values-view.svelte";

  let valuesClient = $derived(enumsClient.values($page.params.key));
</script>

{#key $page.params.key}
  <TableView
    title={resource.enum($page.params.key)}
    client={valuesClient}
    create={EnumValuesCreate}
    remove={EnumValuesRemove}
    view={EnumValuesView}
    noExport
  >
    {#snippet tableHeader()}
      <th>Název hodnoty</th>
      <th class="w-[75px]">Stav</th>
      <th>Založeno</th>
      <th class="w-[70px]"></th>
    {/snippet}

    {#snippet tableRow({ item, active, open, remove })}
      <TableRowWithActions {active} {open} {remove}>
        <td>{item.name}</td>
        <td>
          <Badge color={item.enabled ? "green" : "grey"} small>{item.enabled ? "Aktivní" : "Neaktivní"}</Badge>
        </td>
        <td>
          <div>
            {formatDate(item.createdAt)}
          </div>
          <Text font="body-medium-small" color="secondary">
            {item.createdBy}
          </Text>
        </td>
      </TableRowWithActions>
    {/snippet}
  </TableView>
{/key}
