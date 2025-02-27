<script lang="ts">
  import { authClient } from "$lib/auth/auth-client.svelte";
  import { Role } from "$lib/auth/roles";
  import Button from "$lib/components/button.svelte";
  import Checkbox from "$lib/components/checkbox.svelte";
  import InputAffix from "$lib/components/input-affix.svelte";
  import Input from "$lib/components/input.svelte";
  import Select from "$lib/components/select.svelte";
  import Sheet from "$lib/components/sheet.svelte";
  import Textarea from "$lib/components/textarea.svelte";
  import { numeric } from "$lib/format";
  import { resource } from "$lib/resource";
  import { stack } from "$lib/stack.svelte";
  import { toast } from "$lib/toast.svelte";
  import { remaindersClient } from "./remainders-client";

  let meta = remaindersClient.meta();
  let locations = $derived(
    meta.value?.locations.filter((it) => authClient.identity.canUseLocation(Role.Dispecink, it.id)),
  );

  let source = $derived(stack.create ? remaindersClient.get(Number(stack.create)) : undefined);

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
    technologicalGroup = source?.value?.technologicalGroup ?? "";
  });

  let more = $state(false);
  async function onsubmit(e: Event & { currentTarget: HTMLFormElement }) {
    e.preventDefault();

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
      await remaindersClient.create({
        ...Object.fromEntries(payload.entries()),
        crates,
      });
      toast.success("Záznam vytvořen.");

      if (more) {
        form.reset();
      } else {
        stack.closeCreate();
      }
    } catch (err) {
      console.error(err);
      toast.error("Vytvoření selhalo.");
    }
  }
</script>

<Sheet title="Nový záznam" onclose={() => stack.closeCreate()}>
  <form
    {onsubmit}
    id="remainders-create"
    class="grid grid-cols-2 gap-x-[16px] gap-y-[24px] px-[20px] py-[24px]"
    novalidate
  >
    <Select
      id="locationId"
      name="locationId"
      label="DSPU"
      value={source?.value?.locationId}
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
            checked={source?.value?.network === "hps"}
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
            checked={source?.value?.network === "obps"}
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
            checked={source?.value?.network === "ups"}
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
            checked={source?.value?.kind === "toDeliver"}
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
            checked={source?.value?.kind === "undelivered"}
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
            checked={source?.value?.kind === "unprocessed"}
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
      value={source?.value?.amount}
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
          value={source?.value?.crates.find((it) => it.crate === crate)?.amount ?? ""}
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
      <Textarea id="note" name="note" label="Poznámka" />
    </div>
  </form>

  {#snippet footer()}
    <div class="mr-auto">
      <Checkbox bind:checked={more} label="Vytvořit další záznam" />
    </div>
    <Button onclick={() => stack.closeCreate()} variant="outlined">Zavřít</Button>
    <Button form="remainders-create" type="submit" variant="primary">Vytvořit</Button>
  {/snippet}
</Sheet>

<style lang="scss">
  label {
    font: var(--button-medium);
    color: var(--text-primary);

    span {
      color: var(--error-primary);
    }

    .error {
      margin-top: 12px;

      font: var(--caption-regular);
      color: var(--error-primary);
    }
  }
</style>
