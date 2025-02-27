<script lang="ts">
  import { authClient } from "$lib/auth/auth-client.svelte";
  import { Role } from "$lib/auth/roles";
  import Badge from "$lib/components/badge.svelte";
  import TableRowWithActions from "$lib/components/table-row-with-actions.svelte";
  import { formatDate, formatDateTime, formatTime } from "$lib/format";
  import { resource } from "$lib/resource";
  import TableView from "$lib/view/table-view.svelte";
  import { coursesClient } from "./courses-client";
  import CoursesCreate from "./courses-create.svelte";
  import CoursesFilters from "./courses-filters.svelte";
  import CoursesRemove from "./courses-remove.svelte";
  import CoursesView from "./courses-view.svelte";

  let canCreate = $derived(authClient.identity.canUseAnyLocation(Role.Dispecink));
</script>

<TableView
  title="Kurzy"
  client={coursesClient}
  create={canCreate ? CoursesCreate : undefined}
  filters={CoursesFilters}
  remove={CoursesRemove}
  view={CoursesView}
>
  {#snippet tableHeader()}
    <tr>
      <th>Vytvořeno</th>
      <th>DSPU</th>
      <th>Síť</th>
      <th>Kurz</th>
      <th>Datum odjezdu</th>
      <th colspan="2">Odjezd</th>
      <th colspan="2">Příjezd</th>
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
      <td>{item.courseCode}</td>
      <td>{formatDate(item.departureDate)}</td>
      <td>{formatTime(item.departurePlannedTime) ?? "-"}</td>
      <td>
        {#if item.departureDiff}
          <Badge color={item.departureDiff < 0 ? "blue" : "yellow"} small>
            {#if item.departureDiff > 0}+{/if}
            {item.departureDiff}
          </Badge>
        {/if}
      </td>
      <td>{formatTime(item.arrivalPlannedTime) ?? "-"}</td>
      <td>
        {#if item.arrivalDiff}
          <Badge color={item.arrivalDiff < 0 ? "blue" : "yellow"} small>
            {#if item.arrivalDiff > 0}+{/if}
            {item.arrivalDiff}
          </Badge>
        {/if}
      </td>
      <td>{formatDateTime(item.updatedAt) ?? "-"}</td>
    </TableRowWithActions>
  {/snippet}
</TableView>
