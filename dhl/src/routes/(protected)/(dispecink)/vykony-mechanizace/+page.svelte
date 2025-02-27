<script lang="ts">
  import { authClient } from "$lib/auth/auth-client.svelte";
  import { Role } from "$lib/auth/roles";
  import TableRowWithActions from "$lib/components/table-row-with-actions.svelte";
  import { formatDate, formatDateTime } from "$lib/format";
  import { resource } from "$lib/resource";
  import TableView from "$lib/view/table-view.svelte";
  import { machiningsClient } from "./machinings-client";
  import MachiningsCreate from "./machinings-create.svelte";
  import MachiningsFilters from "./machinings-filters.svelte";
  import MachiningsRemove from "./machinings-remove.svelte";
  import MachiningsView from "./machinings-view.svelte";

  let meta = machiningsClient.meta();
  let canCreate = $derived(authClient.identity.canUseAnyLocation(Role.Dispecink));
</script>

<TableView
  title="Výkony mechanizace"
  client={machiningsClient}
  create={canCreate ? MachiningsCreate : undefined}
  filters={MachiningsFilters}
  remove={MachiningsRemove}
  view={MachiningsView}
>
  {#snippet tableHeader()}
    <tr>
      <th>Datum</th>
      <th>DSPU</th>
      {#each meta.value?.machines ?? [] as machine (machine.value)}
        <th>{resource.machine(machine.value)}</th>
      {/each}
      <th>Aktualizováno</th>
      <th></th>
    </tr>
  {/snippet}

  {#snippet tableRow({ item, active, open, remove })}
    <TableRowWithActions
      {active}
      {open}
      remove={authClient.identity.canUseLocation(Role.Dispecink, item.locationId) ? remove : undefined}
    >
      <td>{formatDate(item.dateFor)}</td>
      <td>{item.locationName}</td>
      {#each meta.value?.machines ?? [] as machine (machine.value)}
        <td>{item.machines.find((it) => it.machine === machine.value)?.value ?? "-"}</td>
      {/each}
      <td>{formatDateTime(item.updatedAt) ?? "-"}</td>
    </TableRowWithActions>
  {/snippet}
</TableView>
