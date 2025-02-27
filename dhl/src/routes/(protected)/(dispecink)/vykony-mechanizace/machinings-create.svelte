<script lang="ts">
  import { authClient } from "$lib/auth/auth-client.svelte";
  import { Role } from "$lib/auth/roles";
  import Button from "$lib/components/button.svelte";
  import Input from "$lib/components/input.svelte";
  import Select from "$lib/components/select.svelte";
  import Sheet from "$lib/components/sheet.svelte";
  import { resource } from "$lib/resource";
  import { stack } from "$lib/stack.svelte";
  import { toast } from "$lib/toast.svelte";
  import { machiningsClient } from "./machinings-client";

  let meta = machiningsClient.meta();
  let locations = $derived(
    meta.value?.locations.filter((it) => authClient.identity.canUseLocation(Role.Dispecink, it.id)),
  );

  let errors = $state<Record<string, string>>({});
  function validate(data: FormData) {
    errors = {};

    if (!data.get("dateFor")) {
      errors.dateFor = resource.formError("required");
    }

    if (!data.get("locationId")) {
      errors.locationId = resource.formError("required");
    }

    return Object.keys(errors).length > 0 ? undefined : data;
  }

  async function onsubmit(e: Event & { currentTarget: HTMLFormElement }) {
    e.preventDefault();

    let form = e.currentTarget;
    let data = new FormData(form);
    let payload = validate(data);
    if (!payload) {
      return;
    }

    try {
      let item = await machiningsClient.create(Object.fromEntries(payload.entries()));
      toast.success("Záznam vytvořen.");
      stack.openView(item.id);
    } catch (err) {
      console.error(err);
      toast.error("Vytvoření selhalo.");
    }
  }
</script>

<Sheet title="Nový záznam" onclose={() => stack.closeCreate()}>
  <form
    {onsubmit}
    id="machinings-create"
    class="flex flex-col justify-start items-stretch gap-[20px] p-[20px]"
    novalidate
  >
    <Input
      id="dateFor"
      name="dateFor"
      type="date"
      label="Datum"
      error={errors.dateFor}
      on:input={() => {
        delete errors.dateFor;
      }}
      required
    />

    <Select
      id="locationId"
      name="locationId"
      label="DSPU"
      options={locations?.map((it) => ({ value: it.id, label: it.name }))}
      error={errors.locationId}
      on:change={() => {
        delete errors.locationId;
      }}
      required
    />
  </form>

  {#snippet footer()}
    <Button onclick={() => stack.closeCreate()} variant="outlined">Zavřít</Button>
    <Button form="machinings-create" type="submit" variant="primary">Vytvořit</Button>
  {/snippet}
</Sheet>
