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
  import { regionalReportsClient } from "./regional-reports-client";

  let meta = regionalReportsClient.meta();

  let search = $state("");

  async function onsubmit(e: Event & { currentTarget: HTMLFormElement }) {
    e.preventDefault();

    let form = e.currentTarget;
    let data = new FormData(form);

    let dateFrom = inputDateTimeToISO(data.get("dateFrom") as string);
    let dateTo = inputDateTimeToISO(data.get("dateTo") as string);

    await regionalReportsClient.find({
      filter: {
        createdAt: [dateFrom, dateTo],
        locationId: data.has("locationId") ? (data.getAll("locationId") as string[]) : undefined,
        category: data.has("category") ? (data.getAll("category") as string[]) : undefined,
        network: data.has("network") ? (data.getAll("network") as string[]) : undefined,
        attachment: data.has("attachment") ? (data.getAll("attachment") as string[]) : undefined,
      },
    });

    stack.closeFilters();
  }

  async function onreset() {
    regionalReportsClient.find({ filter: undefined });
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
      <Button form="regional-reports-filters" type="reset" variant="ghost">Zrušit všechny filtry</Button>
    </div>
    <Button onclick={() => stack.closeFilters()} type="button" variant="outlined">Zavřít</Button>
    <Button form="regional-reports-filters" type="submit" variant="primary">Vyfiltrovat</Button>
  {/snippet}

  <form {onsubmit} {onreset} method="post" id="regional-reports-filters" novalidate>
    <FieldGrid cols={2} title="Vytvořeno" offset>
      <Input
        id="dateFrom"
        name="dateFrom"
        type="datetime-local"
        label="Od"
        value={formatDateTimeInput(regionalReportsClient.filter?.createdAt?.[0])}
      />
      <Input
        id="dateTo"
        name="dateTo"
        type="datetime-local"
        label="Do"
        value={formatDateTimeInput(regionalReportsClient.filter?.createdAt?.[1])}
      />
    </FieldGrid>

    <Divider />

    <FieldGrid title="Provozovna" offset>
      <ChipGrid>
        {#each meta.value?.locations ?? [] as item (item.id)}
          <Chip
            id="locationId-{item.id}"
            name="locationId"
            value={item.id}
            faded={Boolean(search) && !unaccent(item.name).includes(unaccent(search))}
            checked={regionalReportsClient.filter?.locationId?.includes(item.id)}
          >
            {item.name}
          </Chip>
        {/each}
      </ChipGrid>
    </FieldGrid>

    <Divider />

    <FieldGrid title="Kategorie" offset>
      <ChipGrid>
        {#each ["1-submission", "2-delivery", "3a-transport-dspu", "3a-transport-ups", "3a-transport-other"] as item (item)}
          <Chip
            id="category-{item}"
            name="category"
            value={item}
            faded={Boolean(search) && !unaccent(resource.regionalReportCategory(item)).includes(unaccent(search))}
            checked={regionalReportsClient.filter?.category?.includes(item)}
          >
            {resource.regionalReportCategory(item)}
          </Chip>
        {/each}
      </ChipGrid>
    </FieldGrid>

    <Divider />

    <FieldGrid title="Typ sítě" offset>
      <ChipGrid>
        {#each ["l", "b", "lb"] as item (item)}
          <Chip
            id="network-{item}"
            name="network"
            value={item}
            faded={Boolean(search) && !unaccent(resource.regionalReportNetwork(item)).includes(unaccent(search))}
            checked={regionalReportsClient.filter?.network?.includes(item)}
          >
            {resource.regionalReportNetwork(item)}
          </Chip>
        {/each}
      </ChipGrid>
    </FieldGrid>

    <Divider />

    <FieldGrid title="Příloha" offset>
      <ChipGrid>
        <Chip
          id="attachment-yes"
          name="attachment"
          value="yes"
          faded={Boolean(search) && !"ano".includes(unaccent(search))}
          checked={regionalReportsClient.filter?.attachment?.includes("yes")}
        >
          Ano
        </Chip>
        <Chip
          id="attachment-no"
          name="attachment"
          value="no"
          faded={Boolean(search) && !"ne".includes(unaccent(search))}
          checked={regionalReportsClient.filter?.attachment?.includes("no")}
        >
          Ne
        </Chip>
      </ChipGrid>
    </FieldGrid>
  </form>
</Sheet>
