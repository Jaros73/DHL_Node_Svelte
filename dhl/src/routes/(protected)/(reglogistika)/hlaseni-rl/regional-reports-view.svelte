<script lang="ts">
  import { authClient } from "$lib/auth/auth-client.svelte";
  import { Role } from "$lib/auth/roles";
  import Avatar from "$lib/components/avatar.svelte";
  import Button from "$lib/components/button.svelte";
  import Divider from "$lib/components/divider.svelte";
  import FileUpload from "$lib/components/file-upload.svelte";
  import Icon from "$lib/components/icon.svelte";
  import InfoGridValue from "$lib/components/info-grid-value.svelte";
  import InfoGrid from "$lib/components/info-grid.svelte";
  import Input from "$lib/components/input.svelte";
  import Select from "$lib/components/select.svelte";
  import Sheet from "$lib/components/sheet.svelte";
  import Text from "$lib/components/text.svelte";
  import Textarea from "$lib/components/textarea.svelte";
  import { formatDateInput, formatDateTime } from "$lib/format";
  import { resource } from "$lib/resource";
  import { stack } from "$lib/stack.svelte";
  import { toast } from "$lib/toast.svelte";
  import { faClone, faFile, faSpinner, faTrashAlt } from "@fortawesome/free-solid-svg-icons";
  import { fade } from "svelte/transition";
  import { regionalReportsClient } from "./regional-reports-client";

  let meta = regionalReportsClient.meta();
  let item = $derived(stack.view ? regionalReportsClient.get(Number(stack.view)) : undefined);

  let fileList = $state<File[]>([]);
  async function addFiles(e: Event & { currentTarget: HTMLInputElement }) {
    if (!item?.value) {
      return;
    }

    let input = e.currentTarget;
    let files = input.files;
    if (!files) {
      return;
    }

    fileList = [...files];
    for (let file of files) {
      let data = new FormData();
      data.set("file", file);

      try {
        let res = await regionalReportsClient.uploadFiles(item.value.id, data);
        item.value.attachments = res.attachments;
        fileList = fileList.filter((it) => it.name !== file.name);
      } catch (err) {
        console.error(err);
      }
    }

    input.value = "";
  }

  async function removeFile(filename: string) {
    if (!item?.value) {
      return;
    }

    try {
      let res = await regionalReportsClient.removeFile(item.value.id, filename);
      item.value.attachments = res.attachments;
    } catch (err) {
      console.error(err);
    }
  }

  let errors = $state<Record<string, string>>({});
  function validate(data: FormData) {
    errors = {};

    ["category", "network", "locationId", "dateFor", "description"].forEach((it) => {
      if (!data.get(it)) {
        errors[it] = resource.formError("required");
      }
    });

    return Object.keys(errors).length > 0 ? undefined : data;
  }

  let category = $state("");
  $effect(() => {
    category = item?.value?.category ?? "";
  });

  let courseEnabled = $derived(category.startsWith("3"));
  async function onsubmit(e: Event & { currentTarget: HTMLFormElement }) {
    e.preventDefault();

    if (!item?.value) {
      return;
    }

    let form = e.currentTarget;
    let data = new FormData(form);
    let payload = validate(data);
    if (!payload) {
      return;
    }

    try {
      await regionalReportsClient.update(item.value.id, Object.fromEntries(payload.entries()));
      toast.success("Záznam aktualizován.");
      stack.closeView();
    } catch (err) {
      console.error(err);
      toast.error("Aktualizace selhala.");
    }
  }
</script>

<Sheet title="Úprava záznamu" onclose={() => stack.closeView()}>
  {#snippet actions()}
    {#if authClient.identity.canUseAnyLocation(Role.Dispecink)}
      <Button
        onclick={() => {
          if (item?.value?.id) {
            stack.openCreate(item.value.id);
          }
        }}
        icon={faClone}
        variant="transparent"
      >
        Duplikovat
      </Button>
    {/if}

    <Button
      onclick={() => {
        if (item?.value?.id) {
          stack.openRemove(item.value.id);
        }
      }}
      icon={faTrashAlt}
      variant="transparent"
    >
      Smazat
    </Button>
  {/snippet}

  {#snippet footer()}
    <Button onclick={() => stack.closeView()} variant="outlined">Zavřít</Button>
    <Button form="regional-reports-edit" type="submit" variant="primary">Uložit</Button>
  {/snippet}

  <InfoGrid title="Všeobecné údaje">
    <InfoGridValue label="Vytvořeno">
      <div class="flex flex-row">
        {formatDateTime(item?.value?.createdAt)}

        <div class="flex flex-row gap-[8px] ml-[24px]">
          <Avatar small>{item?.value?.createdByFullName[0]}</Avatar>
          {item?.value?.createdByFullName}
        </div>
      </div>
    </InfoGridValue>

    <InfoGridValue label="Aktualizováno">
      <div class="flex flex-row">
        {formatDateTime(item?.value?.updatedAt) ?? "-"}

        {#if item?.value?.updatedByFullName}
          <div class="flex flex-row items-center gap-[8px] ml-[24px]">
            <Avatar small>{item?.value?.updatedByFullName[0]}</Avatar>
            {item?.value?.updatedByFullName}
          </div>
        {/if}
      </div>
    </InfoGridValue>
  </InfoGrid>

  <Divider />

  <form {onsubmit} id="regional-reports-edit" novalidate>
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
        required
      />

      <Select
        id="network"
        name="network"
        label="Typ sítě"
        value={item?.value?.network}
        options={["l", "b", "lb"].map((it) => ({
          label: resource.regionalReportNetwork(it),
          value: it,
        }))}
        error={errors.network}
        on:change={() => {
          delete errors["network"];
        }}
        required
      />

      <Select
        id="locationId"
        name="locationId"
        label="Provozovna"
        value={item?.value?.locationId}
        options={meta.value?.locations.map((it) => ({
          label: it.name,
          value: it.id,
        }))}
        error={errors.locationId}
        on:change={() => {
          delete errors.locationId;
        }}
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
        value={formatDateInput(item?.value?.dateFor)}
        error={errors.dateFor}
        on:input={() => {
          delete errors.dateFor;
        }}
        required
      />

      <Textarea
        id="description"
        name="description"
        label="Popis"
        value={item?.value?.description}
        error={errors.description}
        on:input={() => {
          delete errors.description;
        }}
        required
      />

      <Textarea id="actionTaken" name="actionTaken" label="Přijatá opatření" value={item?.value?.actionTaken} />
    </div>

    <Divider />

    <div class="flex flex-col justify-start items-stretch gap-[24px] px-[20px] py-[24px]">
      <Text font="subheadline-bold-large">Přílohy</Text>

      <FileUpload oninput={addFiles} />

      <div class="flex flex-col gap-[8px]">
        {#each item?.value?.attachments ?? [] as file (file.filename)}
          <a
            transition:fade={{ duration: 250 }}
            href="/api/regional-reports/{item?.value?.id}/{file.filename}"
            target="_blank"
            class="file flex flex-row justify-start items-center gap-[12px] p-[12px]"
          >
            <Icon icon={faFile} />
            <Text>{file.displayName}</Text>
            <div class="ml-auto">
              <Button
                onclick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();

                  removeFile(file.filename);
                }}
                icon={faTrashAlt}
                type="button"
                variant="ghost"
                small
              />
            </div>
          </a>
        {/each}

        {#each fileList as file (file.name)}
          <div
            transition:fade={{ duration: 250 }}
            class="file flex flex-row justify-start items-center gap-[12px] p-[12px]"
          >
            <Icon icon={faFile} />
            <Text>{file.name}</Text>
            <div class="ml-auto">
              <Icon icon={faSpinner} spin />
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
        <Input
          id="courseCode"
          name="courseCode"
          label="Číslo kurzu"
          value={item?.value?.courseCode}
          disabled={!courseEnabled}
        />
      </div>

      <Input
        id="coursePlannedArrival"
        name="coursePlannedArrival"
        type="time"
        label="Příjezd dle JŘ"
        value={item?.value?.coursePlannedArrival}
        disabled={!courseEnabled}
      />
      <Input
        id="courseRealArrival"
        name="courseRealArrival"
        type="time"
        label="Skutečný příjezd"
        value={item?.value?.courseRealArrival}
        disabled={!courseEnabled}
      />

      <div class="col-span-2">
        <Select
          id="courseDelayEnumId"
          name="courseDelayEnumId"
          label="Příčina zpoždění"
          value={item?.value?.courseDelayEnumId}
          options={meta.value?.delayReasons.map((it) => ({
            label: it.name,
            value: `${it.id}`,
          }))}
          disabled={!courseEnabled}
        />
      </div>

      <div class="col-span-2">
        <Textarea id="note" name="note" label="Poznámka" value={item?.value?.note} disabled={!courseEnabled} />
      </div>
    </div>
  </form>
</Sheet>

<style lang="scss">
  .file {
    background-color: var(--background-light);

    border-radius: var(--small);

    transition-property: background-color;

    &:hover {
      background-color: var(--background-medium);
    }
  }
</style>
