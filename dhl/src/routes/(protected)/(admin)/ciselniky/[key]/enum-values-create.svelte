<script lang="ts">
  import { page } from "$app/stores";
  import Button from "$lib/components/button.svelte";
  import Checkbox from "$lib/components/checkbox.svelte";
  import Input from "$lib/components/input.svelte";
  import Sheet from "$lib/components/sheet.svelte";
  import { resource } from "$lib/resource";
  import { stack } from "$lib/stack.svelte";
  import { toast } from "$lib/toast.svelte";
  import { enumsClient } from "../enums-client.svelte";

  let valuesClient = enumsClient.values($page.params.key);

  let errors = $state<Record<string, string>>({});
  function validate(data: FormData) {
    errors = {};

    if (!data.get("name")) {
      errors.name = resource.formError("required");
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
      await valuesClient.create(Object.fromEntries(data.entries()));
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
  <form {onsubmit} id="enum-values-create" class="p-[20px]" novalidate>
    <Input
      id="name"
      name="name"
      label="Hodnota"
      error={errors.name}
      on:input={() => {
        delete errors.name;
      }}
      required
    />
  </form>

  {#snippet footer()}
    <div class="mr-auto">
      <Checkbox bind:checked={more} label="Vytvořit další záznam" />
    </div>

    <Button onclick={() => stack.closeCreate()} variant="outlined">Zavřít</Button>
    <Button type="submit" form="enum-values-create" variant="primary">Vytvořit</Button>
  {/snippet}
</Sheet>
