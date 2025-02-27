<script lang="ts">
  import Button from "$lib/components/button.svelte";
  import Checkbox from "$lib/components/checkbox.svelte";
  import Divider from "$lib/components/divider.svelte";
  import FileUpload from "$lib/components/file-upload.svelte";
  import Icon from "$lib/components/icon.svelte";
  import Input from "$lib/components/input.svelte";
  import Select from "$lib/components/select.svelte";
  import Sheet from "$lib/components/sheet.svelte";
  import Text from "$lib/components/text.svelte";
  import Textarea from "$lib/components/textarea.svelte";
  import { resource } from "$lib/resource";
  import { stack } from "$lib/stack.svelte";
  import { toast } from "$lib/toast.svelte";
  import { faCircleNotch, faFile, faTimes } from "@fortawesome/free-solid-svg-icons";
  import { fade } from "svelte/transition";
  import { regionalReportsClient } from "./regional-reports-client";

  let meta = regionalReportsClient.meta();
  let source = $derived(stack.create ? regionalReportsClient.get(Number(stack.create)) : undefined);

  let fileList = $state<File[]>([]);
  function addFiles(e: Event & { currentTarget: HTMLInputElement }) {
    let input = e.currentTarget;
    let files = input.files;
    if (!files) {
      return;
    }

    fileList.push(...files);
    input.value = "";
  }

  function removeFile(ix: number) {
    fileList.splice(ix, 1);
  }

  let errors = $state<Record<string, string>>({});
  function validate(data: FormData) {
    errors = {};

    ["category", "network", "locationId", "dateFor", "description"].forEach((it) => {
      if (!data.get(it)) {
        errors[it] = resource.formError("required");
      }
    });

    for (let file of fileList) {
      data.append("files", file);
    }

    return Object.keys(errors).length > 0 ? undefined : data;
  }

  let category = $state("");
  $effect(() => {
    category = source?.value?.category ?? "";
  });

  let courseEnabled = $derived(category.startsWith("3"));
  let more = $state(false);
  let submitting = $state(false);
  async function onsubmit(e: Event & { currentTarget: HTMLFormElement }) {
    e.preventDefault();

    let form = e.currentTarget;
    let data = new FormData(form);
    let payload = validate(data);
    if (!payload) {
      return;
    }

    submitting = true;

    try {
      await regionalReportsClient.create(payload);
      toast.success("Záznam vytvořen.");

      if (more) {
        form.reset();
        fileList = [];
      } else {
        stack.closeCreate();
      }
    } catch (err) {
      console.error(err);
      toast.error("Vytvoření selhalo.");
    }

    submitting = false;
  }
</script>

<Sheet title="Nový záznam" onclose={() => stack.closeCreate()}>
  <form {onsubmit} id="regional-reports-create" novalidate>
    <div class="flex flex-col justify-start items-stretch gap-[24px] px-[20px] py-[24px]">
      <Select
        bind:value={category}
        id="category"
        name="category"
        label="Kategorie"
        options={["1-submission", "2-delivery", "3a-transport-dspu", "3a-transport-ups", "3a-transport-other"].map(
          (it) => ({
            label: resource.regionalReportCategory(it),
            value: it,
          }),
        )}
        error={errors.category}
        on:change={() => {
          delete errors.category;
        }}
        disabled={submitting}
        required
      />

      <Select
        id="network"
        name="network"
        label="Typ sítě"
        value={source?.value?.network}
        options={["l", "b", "lb"].map((it) => ({
          label: resource.regionalReportNetwork(it),
          value: it,
        }))}
        error={errors.network}
        on:change={() => {
          delete errors["network"];
        }}
        disabled={submitting}
        required
      />

      <Select
        id="locationId"
        name="locationId"
        label="Provozovna"
        value={source?.value?.locationId}
        options={meta.value?.locations.map((it) => ({
          label: it.name,
          value: it.id,
        }))}
        error={errors.locationId}
        on:change={() => {
          delete errors.locationId;
        }}
        disabled={submitting}
        required
      />
    </div>

    <Divider />

    <div class="flex flex-col justify-start items-stretch gap-[24px] px-[20px] py-[24px]">
      <Text font="subheadline-bold-large">Nepravidelnost</Text>

      <Input
        id="dateFor"
        name="dateFor"
        type="date"
        label="Datum"
        error={errors.dateFor}
        on:input={() => {
          delete errors.dateFor;
        }}
        disabled={submitting}
        required
      />

      <Textarea
        id="description"
        name="description"
        label="Popis"
        error={errors.description}
        on:input={() => {
          delete errors.description;
        }}
        disabled={submitting}
        required
      />

      <Textarea id="actionTaken" name="actionTaken" label="Přijatá opatření" disabled={submitting} />
    </div>

    <Divider />

    <div class="flex flex-col justify-start items-stretch gap-[24px] px-[20px] py-[24px]">
      <Text font="subheadline-bold-large">Přílohy</Text>

      <FileUpload oninput={addFiles} disabled={submitting} />

      <div class="flex flex-col gap-[8px]">
        {#each fileList as file, i (i)}
          <div
            transition:fade={{ duration: 250 }}
            class="file flex flex-row justify-start items-center gap-[12px] p-[12px]"
          >
            <Icon icon={faFile} />
            <Text>{file.name}</Text>
            <div class="ml-auto">
              <Button
                onclick={() => removeFile(i)}
                type="button"
                icon={faTimes}
                variant="ghost"
                small
                disabled={submitting}
              />
            </div>
          </div>
        {/each}
      </div>
    </div>

    <Divider />

    <div class="grid grid-cols-2 gap-x-[16px] gap-y-[24px] px-[20px] py-[24px]">
      <div class="col-span-2">
        <Text font="subheadline-bold-large">Kurz</Text>
      </div>

      <div class="col-span-2">
        <Input id="courseCode" name="courseCode" label="Číslo kurzu" disabled={!courseEnabled || submitting} />
      </div>

      <Input
        id="coursePlannedArrival"
        name="coursePlannedArrival"
        type="time"
        label="Příjezd dle JŘ"
        disabled={!courseEnabled || submitting}
      />
      <Input
        id="courseRealArrival"
        name="courseRealArrival"
        type="time"
        label="Skutečný příjezd"
        disabled={!courseEnabled || submitting}
      />

      <div class="col-span-2">
        <Select
          id="courseDelayEnumId"
          name="courseDelayEnumId"
          label="Příčina zpoždění"
          options={meta.value?.delayReasons.map((it) => ({
            label: it.name,
            value: `${it.id}`,
          }))}
          disabled={!courseEnabled || submitting}
        />
      </div>

      <div class="col-span-2">
        <Textarea id="note" name="note" label="Poznámka" disabled={!courseEnabled || submitting} />
      </div>
    </div>
  </form>

  {#snippet footer()}
    <div class="mr-auto">
      {#if submitting}
        <div class="flex flex-row justify-start items-center gap-[16px] mr-auto">
          <Icon icon={faCircleNotch} spin />
          <Text color="primary">Nahrávam soubory</Text>
        </div>
      {:else}
        <Checkbox bind:checked={more} label="Vytvořit další záznam" disabled={submitting} />
      {/if}
    </div>
    <Button onclick={() => stack.closeCreate()} variant="outlined" disabled={submitting}>Zavřít</Button>
    <Button form="regional-reports-create" type="submit" variant="primary" disabled={submitting}>Vytvořit</Button>
  {/snippet}
</Sheet>

<style lang="scss">
  .file {
    background-color: var(--backdrop);

    border-radius: var(--small);
  }
</style>
