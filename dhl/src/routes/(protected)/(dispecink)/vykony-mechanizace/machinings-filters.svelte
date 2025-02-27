<script lang="ts">
  import Button from "$lib/components/button.svelte";
  import ChipGrid from "$lib/components/chip-grid.svelte";
  import Chip from "$lib/components/chip.svelte";
  import Divider from "$lib/components/divider.svelte";
  import FieldGrid from "$lib/components/field-grid.svelte";
  import Input from "$lib/components/input.svelte";
  import SearchBar from "$lib/components/search-bar.svelte";
  import Sheet from "$lib/components/sheet.svelte";
  import { formatDateInput, inputDateToISO } from "$lib/format";
  import { stack } from "$lib/stack.svelte";
  import { unaccent } from "$lib/unaccent";
  import { machiningsClient } from "./machinings-client";

  let meta = machiningsClient.meta();

  let search = $state("");

  async function onsubmit(e: Event & { currentTarget: HTMLFormElement }) {
    e.preventDefault();

    let form = e.currentTarget;
    let data = new FormData(form);

    let dateFrom = inputDateToISO(data.get("dateFrom") as string);
    let dateTo = inputDateToISO(data.get("dateTo") as string);

    await machiningsClient.find({
      filter: {
        dateFor: [dateFrom, dateTo],
        locationId: data.has("locationId") ? (data.getAll("locationId") as string[]) : undefined,
      },
    });

    stack.closeFilters();
  }

  async function onreset() {
    machiningsClient.find({ filter: undefined });
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
      <Button form="machinings-filters" type="reset" variant="ghost">Zrušit všechny filtry</Button>
    </div>
    <Button onclick={() => stack.closeFilters()} type="button" variant="outlined">Zavřít</Button>
    <Button form="machinings-filters" type="submit" variant="primary">Vyfiltrovat</Button>
  {/snippet}

  <form {onsubmit} {onreset} method="post" id="machinings-filters" novalidate>
    <FieldGrid cols={2} title="Datum" offset>
      <Input
        id="dateFrom"
        name="dateFrom"
        type="date"
        label="Od"
        value={formatDateInput(machiningsClient.filter?.dateFor?.[0])}
      />
      <Input
        id="dateTo"
        name="dateTo"
        type="date"
        label="Do"
        value={formatDateInput(machiningsClient.filter?.dateFor?.[1])}
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
            checked={machiningsClient.filter?.locationId?.includes(item.id)}
          >
            {item.name}
          </Chip>
        {/each}
      </ChipGrid>
    </FieldGrid>
  </form>
</Sheet>
