<script lang="ts">
  import { authClient } from "$lib/auth/auth-client.svelte";
  import { Role } from "$lib/auth/roles";
  import Avatar from "$lib/components/avatar.svelte";
  import Button from "$lib/components/button.svelte";
  import Divider from "$lib/components/divider.svelte";
  import InfoGridValue from "$lib/components/info-grid-value.svelte";
  import InfoGrid from "$lib/components/info-grid.svelte";
  import Input from "$lib/components/input.svelte";
  import Select from "$lib/components/select.svelte";
  import Sheet from "$lib/components/sheet.svelte";
  import Textarea from "$lib/components/textarea.svelte";
  import { formatDate, formatDateTime, formatDateTimeInput, inputDateTimeToISO } from "$lib/format";
  import { resource } from "$lib/resource";
  import { stack } from "$lib/stack.svelte";
  import { toast } from "$lib/toast.svelte";
  import { faClone, faTrashAlt } from "@fortawesome/free-solid-svg-icons";
  import { dispatchClient } from "./dispatch-client";

  let meta = dispatchClient.meta();
  let item = $derived(stack.view ? dispatchClient.get(Number(stack.view)) : undefined);
  let locations = $derived(
    meta.value?.locations.filter((it) => authClient.identity.canUseLocation(Role.Dispecink, it.id)),
  );

  let canEdit = $derived(
    item?.value?.locationId ? authClient.identity.canUseLocation(Role.Dispecink, item?.value?.locationId) : false,
  );

  let errors = $state<Record<string, string>>({});
  function validate(data: FormData) {
    errors = {};

    if (!data.get("locationId")) {
      errors.locationId = resource.formError("required");
    }

    let userTime = inputDateTimeToISO(data.get("userTime") as string);
    if (!userTime) {
      errors.userTime = resource.formError("required");
    } else {
      data.set("userTime", userTime);
    }

    if (!data.get("typeEnumId")) {
      errors.typeEnumId = resource.formError("required");
    }

    if (!data.get("keyEnumId")) {
      errors.keyEnumId = resource.formError("required");
    }

    return Object.keys(errors).length > 0 ? undefined : data;
  }

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
      await dispatchClient.update(item.value.id, Object.fromEntries(payload.entries()));
      toast.success("Záznam aktualizován.");
      stack.closeView();
    } catch (err) {
      console.error(err);
      toast.error("Vytvoření selhalo.");
    }
  }
</script>

<Sheet title="{canEdit ? 'Úprava' : 'Náhled'} záznamu" onclose={() => stack.closeView()}>
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

    {#if canEdit}
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
    {/if}
  {/snippet}

  {#snippet footer()}
    <Button onclick={() => stack.closeView()} variant="outlined">Zavřít</Button>
    {#if canEdit}
      <Button form="dispatch-edit" type="submit" variant="primary">Uložit</Button>
    {/if}
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

    {#if !canEdit}
      <InfoGridValue label="DSPU">
        {item?.value?.locationId}
      </InfoGridValue>

      <InfoGridValue label="Datum ku">
        {formatDate(item?.value?.userTime)}
      </InfoGridValue>

      <InfoGridValue label="Typ">
        {item?.value?.typeEnumName}
      </InfoGridValue>

      <InfoGridValue label="Klíč">
        {item?.value?.keyEnumName}
      </InfoGridValue>

      <InfoGridValue label="Popis">
        {item?.value?.description}
      </InfoGridValue>
    {/if}
  </InfoGrid>

  {#if canEdit}
    <Divider />
    <form
      {onsubmit}
      id="dispatch-edit"
      class="grid grid-cols-2 gap-x-[16px] gap-y-[24px] px-[20px] py-[24px]"
      novalidate
    >
      <Select
        id="locationId"
        name="locationId"
        label="DSPU"
        value={item?.value?.locationId}
        options={locations?.map((it) => ({ value: it.id, label: it.name }))}
        error={errors.locationId}
        on:change={() => {
          delete errors.locationId;
        }}
        required
      />

      <Input
        id="userTime"
        name="userTime"
        type="datetime-local"
        label="Datum"
        value={formatDateTimeInput(item?.value?.userTime)}
        error={errors.userTime}
        on:input={() => {
          delete errors.userTime;
        }}
        required
      />

      <Select
        id="typeEnumId"
        name="typeEnumId"
        label="Typ"
        value={`${item?.value?.typeEnumId}`}
        options={meta.value?.types.map((it) => ({ value: `${it.id}`, label: it.name }))}
        error={errors.typeEnumId}
        on:change={() => {
          delete errors.typeEnumId;
        }}
        required
      />
      <Select
        id="keyEnumId"
        name="keyEnumId"
        label="Klíč"
        value={`${item?.value?.keyEnumId}`}
        options={meta.value?.keys.map((it) => ({ value: `${it.id}`, label: it.name }))}
        error={errors.keyEnumId}
        on:change={() => {
          delete errors.keyEnumId;
        }}
        required
      />

      <div class="col-span-2">
        <Textarea id="description" name="description" label="Popis" value={item?.value?.description} />
      </div>
    </form>
  {/if}
</Sheet>
