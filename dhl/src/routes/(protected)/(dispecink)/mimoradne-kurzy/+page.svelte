<script lang="ts">
  import { authClient } from "$lib/auth/auth-client.svelte";
  import { Role } from "$lib/auth/roles";
  import Badge from "$lib/components/badge.svelte";
  import TableRowWithActions from "$lib/components/table-row-with-actions.svelte";
  import Text from "$lib/components/text.svelte";
  import { formatDateTime } from "$lib/format";
  import { resource } from "$lib/resource";
  import TableView from "$lib/view/table-view.svelte";
  import { irregularCoursesClient } from "./irregular-courses-client";
  import IrregularCoursesCreate from "./irregular-courses-create.svelte";
  import IrregularCoursesFilters from "./irregular-courses-filters.svelte";
  import IrregularCoursesRemove from "./irregular-courses-remove.svelte";
  import IrregularCoursesView from "./irregular-courses-view.svelte";

  let canCreate = $derived(authClient.identity.canUseAnyLocation(Role.Dispecink));
</script>

<TableView
  title="Mimořádne kurzy"
  client={irregularCoursesClient}
  create={canCreate ? IrregularCoursesCreate : undefined}
  filters={IrregularCoursesFilters}
  remove={IrregularCoursesRemove}
  view={IrregularCoursesView}
>
  {#snippet tableHeader()}
    <tr>
      <th>Vytvořeno</th>
      <th>DSPU</th>
      <th>Síť</th>
      <th class="!text-right">Vytížení</th>
      <th>Odjezd</th>
      <th>Zastávky</th>
      <th>Příjezd</th>
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
      <td>{resource.transportNetwork(item.network)}</td>
      <td class="!text-right">{item.load ?? "-"} <Text element="span" color="secondary">%</Text></td>
      <td>{item.initialStopName}</td>
      <td>
        <Badge small>{item.stopsCount}</Badge>
      </td>
      <td>{item.finalStopName}</td>
      <td>{formatDateTime(item.updatedAt) ?? "-"}</td>
    </TableRowWithActions>
  {/snippet}
</TableView>
