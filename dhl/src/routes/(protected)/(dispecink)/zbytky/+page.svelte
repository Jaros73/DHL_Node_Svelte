<script lang="ts">
  import { authClient } from "$lib/auth/auth-client.svelte";
  import { Role } from "$lib/auth/roles";
  import TableRowWithActions from "$lib/components/table-row-with-actions.svelte";
  import { formatDate, formatDateTime } from "$lib/format";
  import { resource } from "$lib/resource";
  import TableView from "$lib/view/table-view.svelte";
  import { remaindersClient } from "./remainders-client";
  import RemaindersCreate from "./remainders-create.svelte";
  import RemaindersFilters from "./remainders-filters.svelte";
  import RemaindersRemove from "./remainders-remove.svelte";
  import RemaindersView from "./remainders-view.svelte";

  let meta = remaindersClient.meta();
  let canCreate = $derived(authClient.identity.canUseAnyLocation(Role.Dispecink));
</script>

<TableView
  title="Zbytky"
  client={remaindersClient}
  create={canCreate ? RemaindersCreate : undefined}
  filters={RemaindersFilters}
  remove={RemaindersRemove}
  view={RemaindersView}
>
  {#snippet tableHeader()}
    <tr>
      <th>Vytvořeno</th>
      <th>DSPU</th>
      <th>Datum ku</th>
      <th>Síť</th>
      <th>Druh</th>
      <th>Technologická skupina</th>
      <th class="!text-right">Počet</th>
      {#each meta.value?.crates ?? [] as crate (crate.value)}
        <th class="!text-right">{resource.crate(crate.value)}</th>
      {/each}
      <th></th>
    </tr>
  {/snippet}

  {#snippet tableRow({ item, active, open, clone, remove })}
    <TableRowWithActions
      {active}
      {open}
      clone={canCreate ? clone : undefined}
      remove={authClient.identity.canUseLocation(Role.Dispecink, item.locationId) ? remove : undefined}
    >
      <td>{formatDateTime(item.createdAt)}</td>
      <td>{item.locationName}</td>
      <td>{formatDate(item.dateFor)}</td>
      <td>{resource.transportNetwork(item.network)}</td>
      <td>{resource.remainderKind(item.kind)}</td>
      <td>{resource.technologicalGroup(item.technologicalGroup)}</td>
      <td class="!text-right">{item.amount} {item.technologicalGroupUnit}</td>
      {#each meta.value?.crates ?? [] as crate (crate.value)}
        <td class="!text-right">{item.crates.find((it) => it.crate === crate.value)?.amount ?? "-"}</td>
      {/each}
    </TableRowWithActions>
  {/snippet}
</TableView>
