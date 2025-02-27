<script lang="ts">
  import Badge from "$lib/components/badge.svelte";
  import Divider from "$lib/components/divider.svelte";
  import NextButton from "$lib/components/next-button.svelte";
  import SearchBar from "$lib/components/search-bar.svelte";
  import TableRowWithActions from "$lib/components/table-row-with-actions.svelte";
  import Table from "$lib/components/table.svelte";
  import { debounce } from "$lib/debounce";
  import { resource } from "$lib/resource";
  import { stack } from "$lib/stack.svelte";
  import { title } from "$lib/title";
  import { employeesClient } from "./employees-client";
  import EmployeesView from "./employees-view.svelte";

  employeesClient.find({
    filter: undefined,
    search: undefined,
  });

  let onsearch = debounce(300, (search: string) => employeesClient.find({ search }));
</script>

<svelte:head>
  <title>{title("Zaměstnanci")}</title>
</svelte:head>

<SearchBar {onsearch} noFilters />
<Divider />

<Table>
  {#snippet head()}
    <tr>
      <th class="w-[200px]">Osobní číslo</th>
      <th class="w-[200px]">Příjmení</th>
      <th class="w-[200px]">Jméno</th>
      <th>Role</th>
      <th></th>
    </tr>
  {/snippet}

  {#each employeesClient.items as employee (employee.id)}
    <TableRowWithActions active={employee.id === stack.view} open={() => stack.openView(employee.id)}>
      <td>{employee.id}</td>
      <td>{employee.surname}</td>
      <td>{employee.givenName}</td>
      <td>
        <div class="flex flex-row items-center gap-[10px]">
          {#each employee.roles.slice(0, 3) as role (role)}
            <Badge small>{resource.role(role)}</Badge>
          {/each}

          {#if employee.roles.length > 3}
            <Badge small>+{employee.roles.length - 3}</Badge>
          {/if}
        </div>
      </td>
    </TableRowWithActions>
  {/each}
</Table>

<Divider />
<NextButton />

{#if stack.isView}
  <EmployeesView />
{/if}
