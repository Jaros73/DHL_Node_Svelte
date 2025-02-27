<script lang="ts">
  import { authClient } from "$lib/auth/auth-client.svelte";
  import { Role } from "$lib/auth/roles";
  import Badge from "$lib/components/badge.svelte";
  import Icon from "$lib/components/icon.svelte";
  import TableRowWithActions from "$lib/components/table-row-with-actions.svelte";
  import { formatDate, formatDateTime } from "$lib/format";
  import { resource } from "$lib/resource";
  import TableView from "$lib/view/table-view.svelte";
  import { faPaperclip } from "@fortawesome/free-solid-svg-icons";
  import { regionalReportsClient } from "./regional-reports-client";
  import RegionalReportsCreate from "./regional-reports-create.svelte";
  import RegionalReportsFilters from "./regional-reports-filters.svelte";
  import RegionalReportsRemove from "./regional-reports-remove.svelte";
  import RegionalReportsView from "./regional-reports-view.svelte";

  let canCreate = $derived(authClient.identity.canUseAnyLocation(Role.Dispecink));
</script>

<TableView
  title="Hlášení RL"
  client={regionalReportsClient}
  create={canCreate ? RegionalReportsCreate : undefined}
  filters={RegionalReportsFilters}
  remove={RegionalReportsRemove}
  view={RegionalReportsView}
>
  {#snippet tableHeader()}
    <tr>
      <th>Vytvořeno</th>
      <th>Datum ku</th>
      <th>Kategorie</th>
      <th>Typ sítě</th>
      <th>PSČ</th>
      <th>Provozovna</th>
      <th>Příloha</th>
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
      <td>{formatDate(item.dateFor)}</td>
      <td>{resource.regionalReportCategory(item.category)}</td>
      <td>{resource.regionalReportNetwork(item.network)}</td>
      <td>{item.locationZip}</td>
      <td>{item.locationName}</td>
      <td>
        <div class="flex flex-row gap-[4px]">
          <div class="icon">
            <Icon icon={faPaperclip} />
          </div>
          <Badge small>{item.attachments}</Badge>
        </div>
      </td>
      <td>{formatDateTime(item.updatedAt) ?? "-"}</td>
    </TableRowWithActions>
  {/snippet}
</TableView>

<style lang="scss">
  .icon {
    padding: 0 2px;

    line-height: 22px;
    color: var(--text-secondary);

    border-radius: var(--tiny);
  }
</style>
