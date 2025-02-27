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
  import { stack } from "$lib/stack.svelte";
  import { unaccent } from "$lib/unaccent";
  import { dispatchClient } from "./dispatch-client";

  let meta = dispatchClient.meta();

  let search = $state("");

  async function onsubmit(e: Event & { currentTarget: HTMLFormElement }) {
    e.preventDefault();

    let form = e.currentTarget;
    let data = new FormData(form);

    let dateFrom = inputDateTimeToISO(data.get("dateFrom") as string);
    let dateTo = inputDateTimeToISO(data.get("dateTo") as string);

    await dispatchClient.find({
      filter: {
        createdAt: [dateFrom, dateTo],
        locationId: data.has("locationId") ? (data.getAll("locationId") as string[]) : undefined,
        keyEnumId: data.has("keyEnumId") ? (data.getAll("keyEnumId") as string[]) : undefined,
        typeEnumId: data.has("typeEnumId") ? (data.getAll("typeEnumId") as string[]) : undefined,
      },
    });

    stack.closeFilters();
  }

  async function onreset() {
    dispatchClient.find({ filter: undefined });
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
      <Button form="dispatch-filters" type="reset" variant="ghost">Zrušit všechny filtry</Button>
    </div>
    <Button onclick={() => stack.closeFilters()} type="button" variant="outlined">Zavřít</Button>
    <Button form="dispatch-filters" type="submit" variant="primary">Vyfiltrovat</Button>
  {/snippet}

  <form {onsubmit} {onreset} method="post" id="dispatch-filters" novalidate>
    <FieldGrid cols={2} title="Vytvořeno" offset>
      <Input
        id="dateFrom"
        name="dateFrom"
        type="datetime-local"
        label="Od"
        value={formatDateTimeInput(dispatchClient.filter?.createdAt?.[0])}
      />
      <Input
        id="dateTo"
        name="dateTo"
        type="datetime-local"
        label="Do"
        value={formatDateTimeInput(dispatchClient.filter?.createdAt?.[1])}
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
            checked={dispatchClient.filter?.locationId?.includes(item.id)}
          >
            {item.name}
          </Chip>
        {/each}
      </ChipGrid>
    </FieldGrid>

    <Divider />

    <FieldGrid title="Typ" offset>
      <ChipGrid>
        {#each meta.value?.types ?? [] as item (item.id)}
          <Chip
            id="typeEnumId-{item.id}"
            name="typeEnumId"
            value={item.id}
            faded={Boolean(search) && !unaccent(item.name).includes(unaccent(search))}
            checked={dispatchClient.filter?.typeEnumId?.includes(`${item.id}`)}
          >
            {item.name}
          </Chip>
        {/each}
      </ChipGrid>
    </FieldGrid>

    <Divider />

    <FieldGrid title="Klíč" offset>
      <ChipGrid>
        {#each meta.value?.keys ?? [] as item (item.id)}
          <Chip
            id="keyEnumId-{item.id}"
            name="keyEnumId"
            value={item.id}
            faded={Boolean(search) && !unaccent(item.name).includes(unaccent(search))}
            checked={dispatchClient.filter?.keyEnumId?.includes(`${item.id}`)}
          >
            {item.name}
          </Chip>
        {/each}
      </ChipGrid>
    </FieldGrid>
  </form>
</Sheet>
