<script lang="ts">
  import { authClient } from "$lib/auth/auth-client.svelte";
  import { Role } from "$lib/auth/roles";
  import TableRowWithActions from "$lib/components/table-row-with-actions.svelte";
  import { formatDateTime } from "$lib/format";
  import TableView from "$lib/view/table-view.svelte";
  import { dispatchClient } from "./dispatch-client";
  import DispatchCreate from "./dispatch-create.svelte";
  import DispatchFilters from "./dispatch-filters.svelte";
  import DispatchRemove from "./dispatch-remove.svelte";
  import DispatchView from "./dispatch-view.svelte";

  let canCreate = $derived(authClient.identity.canUseAnyLocation(Role.Dispecink));
</script>

<TableView
  title="Dispečerská služba"
  client={dispatchClient}
  create={canCreate ? DispatchCreate : undefined}
  filters={DispatchFilters}
  remove={DispatchRemove}
  view={DispatchView}
>
  {#snippet tableHeader()}
    <tr>
      <th>Vytvořeno</th>
      <th>DSPU</th>
      <th>Datum ku</th>
      <th>Typ</th>
      <th>Klíč</th>
      <th>Popis</th>
      <th>Aktualizováno</th>
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
      <td>{formatDateTime(item.userTime)}</td>
      <td>{item.typeEnumName}</td>
      <td>{item.keyEnumName}</td>
      <td>{item.description ?? "-"}</td>
      <td>{formatDateTime(item.updatedAt) ?? "-"}</td>
    </TableRowWithActions>
  {/snippet}
</TableView>
