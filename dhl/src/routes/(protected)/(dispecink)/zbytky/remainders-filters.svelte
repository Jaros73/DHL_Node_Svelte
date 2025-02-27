<script lang="ts">
  import Button from "$lib/components/button.svelte";
  import ChipGrid from "$lib/components/chip-grid.svelte";
  import Chip from "$lib/components/chip.svelte";
  import Divider from "$lib/components/divider.svelte";
  import FieldGrid from "$lib/components/field-grid.svelte";
  import Input from "$lib/components/input.svelte";
  import SearchBar from "$lib/components/search-bar.svelte";
  import Sheet from "$lib/components/sheet.svelte";
  import { formatDateTimeInput, inputDateTimeToISO } from "$lib/format";
  import { resource } from "$lib/resource";
  import { stack } from "$lib/stack.svelte";
  import { unaccent } from "$lib/unaccent";
  import { remaindersClient } from "./remainders-client";

  let meta = remaindersClient.meta();

  let search = $state("");

  async function onsubmit(e: Event & { currentTarget: HTMLFormElement }) {
    e.preventDefault();

    let form = e.currentTarget;
    let data = new FormData(form);

    let dateFrom = inputDateTimeToISO(data.get("dateFrom") as string);
    let dateTo = inputDateTimeToISO(data.get("dateTo") as string);

    await remaindersClient.find({
      filter: {
        createdAt: [dateFrom, dateTo],
        locationId: data.has("locationId") ? (data.getAll("locationId") as string[]) : undefined,
        network: data.has("network") ? (data.getAll("network") as string[]) : undefined,
        kind: data.has("kind") ? (data.getAll("kind") as string[]) : undefined,
        technologicalGroup: data.has("technologicalGroup")
          ? (data.getAll("technologicalGroup") as string[])
          : undefined,
      },
    });

    stack.closeFilters();
  }

  async function onreset() {
    remaindersClient.find({ filter: undefined });
    stack.closeFilters();
  }
</script>

<Sheet title="Podrobné filtrování" onclose={() => stack.closeFilters()}>
  {#snippet sticky()}
    <SearchBar
      onsearch={(value) => {
        search = value;
      }}
      noFilters
    />
    <Divider />
  {/snippet}

  {#snippet footer()}
    <div class="mr-auto">
      <Button form="remainders-filters" type="reset" variant="ghost">Zrušit všechny filtry</Button>
    </div>
    <Button onclick={() => stack.closeFilters()} type="button" variant="outlined">Zavřít</Button>
    <Button form="remainders-filters" type="submit" variant="primary">Vyfiltrovat</Button>
  {/snippet}

  <form {onsubmit} {onreset} method="post" id="remainders-filters" novalidate>
    <FieldGrid cols={2} title="Vytvořeno" offset>
      <Input
        id="dateFrom"
        name="dateFrom"
        type="datetime-local"
        label="Od"
        value={formatDateTimeInput(remaindersClient.filter?.createdAt?.[0])}
      />
      <Input
        id="dateTo"
        name="dateTo"
        type="datetime-local"
        label="Do"
        value={formatDateTimeInput(remaindersClient.filter?.createdAt?.[1])}
      />
    </FieldGrid>

    <Divider />

    <FieldGrid title="DSPU" offset>
      <ChipGrid>
        {#each meta.value?.locations ?? [] as item (item.id)}
          <Chip
            id="locationId-{item.id}"
            name="locationId"
            value={item.id}
            faded={Boolean(search) && !unaccent(item.name).includes(unaccent(search))}
            checked={remaindersClient.filter?.locationId?.includes(item.id)}
          >
            {item.name}
          </Chip>
        {/each}
      </ChipGrid>
    </FieldGrid>

    <Divider />

    <FieldGrid title="Síť" offset>
      <ChipGrid>
        {#each ["hps", "obps", "ups"] ?? [] as item (item)}
          <Chip
            id="network-{item}"
            name="network"
            value={item}
            faded={Boolean(search) && !item.includes(unaccent(search))}
            checked={remaindersClient.filter?.network?.includes(item)}
          >
            {resource.transportNetwork(item)}
          </Chip>
        {/each}
      </ChipGrid>
    </FieldGrid>

    <Divider />

    <FieldGrid title="Druh" offset>
      <ChipGrid>
        {#each ["toDeliver", "undelivered", "unprocessed"] ?? [] as item (item)}
          <Chip
            id="kind-{item}"
            name="kind"
            value={item}
            faded={Boolean(search) && !unaccent(resource.remainderKind(item)).includes(unaccent(search))}
            checked={remaindersClient.filter?.kind?.includes(item)}
          >
            {resource.remainderKind(item)}
          </Chip>
        {/each}
      </ChipGrid>
    </FieldGrid>

    <Divider />

    <FieldGrid title="Technologická skupina" offset>
      <ChipGrid>
        {#each meta.value?.technologicalGroups ?? [] as item (item.value)}
          <Chip
            id="technologicalGroup-{item.value}"
            name="technologicalGroup"
            value={item.value}
            faded={Boolean(search) && !unaccent(resource.technologicalGroup(item.value)).includes(unaccent(search))}
            checked={remaindersClient.filter?.technologicalGroup?.includes(item.value)}
          >
            {resource.technologicalGroup(item.value)}
          </Chip>
        {/each}
      </ChipGrid>
    </FieldGrid>

    <Divider />
  </form>
</Sheet>
