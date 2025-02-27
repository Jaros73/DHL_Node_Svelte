<script lang="ts">
  import { authClient } from "$lib/auth/auth-client.svelte";
  import { Role } from "$lib/auth/roles";
  import { dispatchClient } from "./dispatch-client";
  import Button from "$lib/components/button.svelte";
  import Checkbox from "$lib/components/checkbox.svelte";
  import Input from "$lib/components/input.svelte";
  import Select from "$lib/components/select.svelte";
  import Sheet from "$lib/components/sheet.svelte";
  import Textarea from "$lib/components/textarea.svelte";
  import { inputDateTimeToISO } from "$lib/format";
  import { resource } from "$lib/resource";
  import { stack } from "$lib/stack.svelte";
  import { toast } from "$lib/toast.svelte";

  let meta = dispatchClient.meta();
  let locations = $derived(
    meta.value?.locations.filter((it) => authClient.identity.canUseLocation(Role.Dispecink, it.id)),
  );

  let source = $derived(stack.create ? dispatchClient.get(Number(stack.create)) : undefined);

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

  let more = $state(false);
  async function onsubmit(e: Event & { currentTarget: HTMLFormElement }) {
    e.preventDefault();

    let form = e.currentTarget;
    let data = new FormData(form);
    let payload = validate(data);
    if (!payload) {
      return;
    }

    try {
      await dispatchClient.create(Object.fromEntries(payload.entries()));
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
    id="dispatch-create"
    class="grid grid-cols-2 gap-x-[16px] gap-y-[24px] px-[20px] py-[24px]"
    novalidate
  >
    <Select
      id="locationId"
      name="locationId"
      label="DSPU"
      value={source?.value?.locationId}
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
      value={`${source?.value?.typeEnumId}`}
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
      value={`${source?.value?.keyEnumId}`}
      options={meta.value?.keys.map((it) => ({ value: `${it.id}`, label: it.name }))}
      error={errors.keyEnumId}
      on:change={() => {
        delete errors.keyEnumId;
      }}
      required
    />

    <div class="col-span-2">
      <Textarea id="description" name="description" label="Popis" value={source?.value?.description} />
    </div>
  </form>

  {#snippet footer()}
    <div class="mr-auto">
      <Checkbox bind:checked={more} label="Vytvořit další záznam" />
    </div>
    <Button onclick={() => stack.closeCreate()} variant="outlined">Zavřít</Button>
    <Button form="dispatch-create" type="submit" variant="primary">Vytvořit</Button>
  {/snippet}
</Sheet>
