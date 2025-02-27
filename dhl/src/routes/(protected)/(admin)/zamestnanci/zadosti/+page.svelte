<script lang="ts">
  import Badge from "$lib/components/badge.svelte";
  import Button from "$lib/components/button.svelte";
  import Checkbox from "$lib/components/checkbox.svelte";
  import Divider from "$lib/components/divider.svelte";
  import Table from "$lib/components/table.svelte";
  import { formatDate } from "$lib/format";
  import { resource } from "$lib/resource";
  import { title } from "$lib/title";
  import { toast } from "$lib/toast.svelte";
  import { faCheck, faTimes } from "@fortawesome/free-solid-svg-icons";
  import { fly } from "svelte/transition";
  import { locationRequestsClient, type RequestLocationApproval } from "./location-requests-client.svelte";

  let selected: Record<string, boolean> = $state({});
  let someChecked = $derived(Object.values(selected).filter((it) => it).length > 0);
  let allChecked = $derived(Object.values(selected).filter((it) => it).length === locationRequestsClient.items.length);

  function handleSelectAll(e: Event) {
    let checked = (e.currentTarget as HTMLInputElement).checked;
    if (!checked) {
      selected = {};
    } else {
      selected = Object.fromEntries(
        locationRequestsClient.items.map((it) => [`${it.userId}-${it.role}-${it.locationId}`, true]),
      );
    }
  }

  async function patchLocations(payload: RequestLocationApproval[]) {
    try {
      await locationRequestsClient.update(payload);
    } catch (err) {
      console.error(err);
      toast.error("Nastavení provozovny selhalo.");
    }
  }

  async function allowSelected() {
    await patchLocations(
      Object.entries(selected)
        .filter(([, value]) => Boolean(value))
        .map(([key]) => {
          let [userId, role, locationId] = key.split("-");
          return {
            userId,
            role,
            locationId,
            action: "approve",
          };
        }),
    );

    selected = {};
  }

  async function rejectSelected() {
    await patchLocations(
      Object.entries(selected)
        .filter(([, value]) => Boolean(value))
        .map(([key]) => {
          let [userId, role, locationId] = key.split("-");
          return {
            userId,
            role,
            locationId,
            action: "reject",
          };
        }),
    );

    selected = {};
  }
</script>

<svelte:head>
  <title>{title("Žádosti")}</title>
</svelte:head>

<Table>
  {#snippet head()}
    <tr>
      <th>
        <Checkbox on:change={handleSelectAll} checked={someChecked} indeterminate={someChecked && !allChecked} />
      </th>
      <th>Zažádano</th>
      <th>Osobní číslo</th>
      <th>Příjmení</th>
      <th>Jméno</th>
      <th>Role</th>
      <th>Provozovna</th>
      <th></th>
    </tr>
  {/snippet}

  {#each locationRequestsClient.items ?? [] as request}
    <tr>
      <td>
        <Checkbox bind:checked={selected[`${request.userId}-${request.role}-${request.locationId}`]} />
      </td>
      <td>{formatDate(request.timeRequested)}</td>
      <td>{request.userId}</td>
      <td>{request.userSurname}</td>
      <td>{request.userGivenName}</td>
      <td>
        <Badge small>{resource.role(request.role)}</Badge>
      </td>
      <td>{request.locationName}</td>
      <td>
        <div class="flex flex-row justify-end items-center gap-[8px]">
          <Button
            onclick={() => {
              patchLocations([
                {
                  locationId: request.locationId,
                  userId: request.userId,
                  role: request.role,
                  action: "reject",
                },
              ]);
            }}
            icon={faTimes}
            variant="transparent"
            small>Zamítnout</Button
          >
          <Button
            onclick={() => {
              patchLocations([
                {
                  locationId: request.locationId,
                  userId: request.userId,
                  role: request.role,
                  action: "approve",
                },
              ]);
            }}
            icon={faCheck}
            variant="transparent"
            small>Příjmout</Button
          >
        </div>
      </td>
    </tr>
  {/each}
</Table>

<Divider />

{#if Object.values(selected).some((it) => it === true)}
  {@const count = Object.values(selected).filter(Boolean).length}
  <div transition:fly={{ y: "100%" }} class="floating-action flex flex-row justify-between items-center">
    {count}
    {#if count === 1}
      záznam vybrán
    {:else if count < 4}
      záznamy vybrány
    {:else}
      záznamů vybráno
    {/if}
    <div class="flex flex-row justify-end items-center gap-[8px]">
      <Button onclick={rejectSelected} icon={faTimes} variant="transparent">Zamítnout</Button>
      <Button onclick={allowSelected} icon={faCheck} variant="transparent">Příjmout</Button>
    </div>
  </div>
{/if}

<style lang="scss">
  .floating-action {
    position: fixed;
    left: 50%;
    bottom: 16px;

    padding: 8px 8px 8px 16px;

    width: 640px;

    background-color: var(--background-light);

    border-radius: var(--small);

    transform: translateX(-50%);
  }
</style>
