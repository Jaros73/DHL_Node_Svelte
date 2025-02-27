<script lang="ts">
  import { authClient } from "$lib/auth/auth-client.svelte";
  import { Role } from "$lib/auth/roles";
  import Avatar from "$lib/components/avatar.svelte";
  import Button from "$lib/components/button.svelte";
  import Divider from "$lib/components/divider.svelte";
  import InfoGridValue from "$lib/components/info-grid-value.svelte";
  import InfoGrid from "$lib/components/info-grid.svelte";
  import InputAffix from "$lib/components/input-affix.svelte";
  import Input from "$lib/components/input.svelte";
  import Select from "$lib/components/select.svelte";
  import Sheet from "$lib/components/sheet.svelte";
  import Textarea from "$lib/components/textarea.svelte";
  import { formatDate, formatDateInput, formatDateTime, numeric } from "$lib/format";
  import { resource } from "$lib/resource";
  import { stack } from "$lib/stack.svelte";
  import { toast } from "$lib/toast.svelte";
  import { faClone, faTrashAlt } from "@fortawesome/free-solid-svg-icons";
  import { remaindersClient } from "./remainders-client";

  let meta = remaindersClient.meta();
  let item = $derived(stack.view ? remaindersClient.get(Number(stack.view)) : undefined);
  let locations = $derived(
    meta.value?.locations.filter((it) => authClient.identity.canUseLocation(Role.Dispecink, it.id)),
  );
  let group = $derived(meta.value?.technologicalGroups.find((it) => it.value === item?.value?.technologicalGroup));

  let canEdit = $derived(
    item?.value?.locationId ? authClient.identity.canUseLocation(Role.Dispecink, item?.value?.locationId) : false,
  );

  let errors = $state<Record<string, string>>({});
  function validate(data: FormData) {
    errors = {};

    if (!data.get("locationId")) {
      errors.locationId = resource.formError("required");
    }

    if (!data.get("dateFor")) {
      errors.dateFor = resource.formError("required");
    }

    if (!data.get("network")) {
      errors.network = resource.formError("required");
    }

    if (!data.get("kind")) {
      errors.kind = resource.formError("required");
    }

    if (!data.get("technologicalGroup")) {
      errors.technologicalGroup = resource.formError("required");
    }

    let amount = data.get("amount") as string;
    if (!amount) {
      errors.amount = resource.formError("required");
    } else if (!numeric.test(amount.trim())) {
      errors.amount = resource.formError("numericPositive");
    }

    for (let [key, value] of data) {
      if (key.startsWith("crate-") && value) {
        if (!numeric.test((value as string).trim())) {
          console.log(key, value);
          errors[key] = resource.formError("numericPositive");
        }
      }
    }

    return Object.keys(errors).length > 0 ? undefined : data;
  }

  let technologicalGroup = $state("");
  $effect(() => {
    technologicalGroup = item?.value?.technologicalGroup ?? "";
  });

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

    let group = meta.value?.technologicalGroups.find((it) => it.value === technologicalGroup);
    let crates: { crate: string; amount: number }[] = [];
    for (let [key, value] of payload) {
      if (key.startsWith("crate-") && value) {
        let crate = key.replace("crate-", "");
        if (group?.crates.some((it) => it.crate === crate)) {
          crates.push({ crate, amount: Number(value) });
        }
      }
    }

    try {
      await remaindersClient.update(item.value.id, {
        ...Object.fromEntries(payload.entries()),
        crates,
      });
      toast.success("Záznam aktualizován.");
      stack.closeView();
    } catch (err) {
      console.error(err);
      toast.error("Aktualizace selhala.");
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
      <Button form="remainders-edit" type="submit" variant="primary">Uložit</Button>
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
          <div class="flex flex-row gap-[8px] ml-[24px]">
            <Avatar small>{item.value.updatedByFullName[0]}</Avatar>
            {item.value.updatedByFullName}
          </div>
        {/if}
      </div>
    </InfoGridValue>

    {#if !canEdit}
      <InfoGridValue label="DSPU">{item?.value?.locationName}</InfoGridValue>
      <InfoGridValue label="Datum ku">{formatDate(item?.value?.dateFor)}</InfoGridValue>
      <InfoGridValue label="Síť">{resource.transportNetwork(item?.value?.network ?? "")}</InfoGridValue>
      <InfoGridValue label="Druh">{resource.remainderKind(item?.value?.kind ?? "")}</InfoGridValue>
      <InfoGridValue label="Technologická skupina">
        {resource.technologicalGroup(item?.value?.technologicalGroup ?? "")}
      </InfoGridValue>
      <InfoGridValue label="Počet">{item?.value?.amount} {group?.unit}</InfoGridValue>
      {#each group?.crates ?? [] as { crate } (crate)}
        <InfoGridValue label={resource.crate(crate)}>
          {item?.value?.crates.find((it) => it.crate === crate)?.amount ?? "-"}
        </InfoGridValue>
      {/each}
    {/if}
  </InfoGrid>

  {#if canEdit}
    <Divider />
    <form
      {onsubmit}
      id="remainders-edit"
      class="grid grid-cols-2 gap-x-[16px] gap-y-[24px] px-[20px] py-[24px]"
      novalidate
    >
      <Select
        id="locationId"
        name="locationId"
        label="DSPU"
        value={item?.value?.locationId}
        options={locations?.map((it) => ({ label: it.name, value: it.id }))}
        error={errors.locationId}
        on:change={() => {
          delete errors.locationId;
        }}
        required
      />

      <Input
        id="dateFor"
        name="dateFor"
        type="date"
        label="Datum ku"
        value={formatDateInput(item?.value?.dateFor)}
        error={errors.dateFor}
        on:input={() => {
          delete errors.dateFor;
        }}
        required
      />

      <label class="col-span-2">
        Síť <span>*</span>
        <div class="flex flex-row justify-start items-center mt-[16px]">
          <label class="flex-1">
            <input
              id="network-hps"
              name="network"
              type="radio"
              value="hps"
              checked={item?.value?.network === "hps"}
              oninput={() => {
                delete errors.network;
              }}
              class="mr-[8px]"
            />
            {resource.transportNetwork("hps")}
          </label>
          <label class="flex-1">
            <input
              id="network-obps"
              name="network"
              type="radio"
              value="obps"
              checked={item?.value?.network === "obps"}
              oninput={() => {
                delete errors.network;
              }}
              class="mr-[8px]"
            />
            {resource.transportNetwork("obps")}
          </label>
          <label class="flex-1">
            <input
              id="network-ups"
              name="network"
              type="radio"
              value="ups"
              checked={item?.value?.network === "ups"}
              oninput={() => {
                delete errors.network;
              }}
              class="mr-[8px]"
            />
            {resource.transportNetwork("ups")}
          </label>
        </div>
        {#if errors.network}
          <div class="error">{resource.formError(errors.network)}</div>
        {/if}
      </label>

      <label class="col-span-2">
        Druh <span>*</span>
        <div class="flex flex-row justify-start items-center mt-[16px]">
          <label class="flex-1">
            <input
              id="kind-toDeliver"
              name="kind"
              type="radio"
              value="toDeliver"
              checked={item?.value?.kind === "toDeliver"}
              oninput={() => {
                delete errors.kind;
              }}
              class="mr-[8px]"
            />
            {resource.remainderKind("toDeliver")}
          </label>
          <label class="flex-1">
            <input
              id="kind-undelivered"
              name="kind"
              type="radio"
              value="undelivered"
              checked={item?.value?.kind === "undelivered"}
              oninput={() => {
                delete errors.kind;
              }}
              class="mr-[8px]"
            />
            {resource.remainderKind("undelivered")}
          </label>
          <label class="flex-1">
            <input
              id="kind-unprocessed"
              name="kind"
              type="radio"
              value="unprocessed"
              checked={item?.value?.kind === "unprocessed"}
              oninput={() => {
                delete errors.kind;
              }}
              class="mr-[8px]"
            />
            {resource.remainderKind("unprocessed")}
          </label>
        </div>
        {#if errors.kind}
          <div class="error">{resource.formError(errors.kind)}</div>
        {/if}
      </label>

      <Select
        bind:value={technologicalGroup}
        id="technologicalGroup"
        name="technologicalGroup"
        label="Technologická skupina"
        options={meta.value?.technologicalGroups.map((it) => ({
          label: resource.technologicalGroup(it.value),
          value: it.value,
        }))}
        error={errors.technologicalGroup}
        on:change={() => {
          delete errors.technologicalGroup;
        }}
        required
      />

      <Input
        id="amount"
        name="amount"
        label="Počet"
        inputmode="numeric"
        value={item?.value?.amount}
        error={errors.amount}
        on:input={() => {
          delete errors.amount;
        }}
        right
        required
      >
        <InputAffix slot="tail">
          {meta.value?.technologicalGroups.find((it) => it.value === technologicalGroup)?.unit ?? ""}
        </InputAffix>
      </Input>

      <div class="col-span-2 grid grid-cols-3 gap-x-[16px] gap-y-[24px]">
        {#each meta.value?.technologicalGroups.find((it) => it.value === technologicalGroup)?.crates ?? [] as { crate } (crate)}
          <Input
            id="crate-{crate}"
            name="crate-{crate}"
            inputmode="numeric"
            value={item?.value?.crates.find((it) => it.crate === crate)?.amount ?? ""}
            error={errors[`crate-${crate}`]}
            on:input={() => {
              delete errors[`crate-${crate}`];
            }}
            right
          >
            <InputAffix slot="lead" dense>
              {resource.crate(crate)}
            </InputAffix>
          </Input>
        {/each}
      </div>

      <div class="col-span-2">
        <Textarea id="note" name="note" label="Poznámka" value={item?.value?.note} />
      </div>
    </form>
  {/if}
</Sheet>

<style lang="scss">
  label {
    font: var(--button-medium);
    color: var(--text-primary);

    span {
      color: var(--error-primary);
    }
  }
</style>
