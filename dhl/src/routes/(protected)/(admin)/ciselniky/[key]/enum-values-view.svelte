<script lang="ts">
  import { page } from "$app/stores";
  import Avatar from "$lib/components/avatar.svelte";
  import Button from "$lib/components/button.svelte";
  import Divider from "$lib/components/divider.svelte";
  import InfoGridValue from "$lib/components/info-grid-value.svelte";
  import InfoGrid from "$lib/components/info-grid.svelte";
  import Input from "$lib/components/input.svelte";
  import Sheet from "$lib/components/sheet.svelte";
  import Switch from "$lib/components/switch.svelte";
  import Text from "$lib/components/text.svelte";
  import { formatDate } from "$lib/format";
  import { resource } from "$lib/resource";
  import { stack } from "$lib/stack.svelte";
  import { toast } from "$lib/toast.svelte";
  import { faTrashAlt } from "@fortawesome/free-solid-svg-icons";
  import { enumsClient } from "../enums-client.svelte";

  let valuesClient = enumsClient.values($page.params.key);
  let item = $derived(stack.view ? valuesClient.get(Number(stack.view)) : undefined);

  let errors = $state<Record<string, string>>({});
  function validate(data: FormData) {
    errors = {};

    if (!data.get("name")) {
      errors.name = resource.formError("required");
    }

    return Object.keys(errors).length > 0 ? undefined : data;
  }

  let enabled = $state(false);
  $effect(() => {
    enabled = item?.value?.enabled ?? false;
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

    try {
      await valuesClient.update(item.value.id, {
        name: payload.get("name") as string,
        enabled: payload.has("enabled"),
      });
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
    <Button
      onclick={() => {
        if (item?.value) {
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
    <Button type="submit" form="enum-values-edit" variant="primary">Uložit</Button>
  {/snippet}

  <InfoGrid title="Všeobecné údaje">
    <InfoGridValue label="Vytvořeno">
      <div class="flex flex-row">
        {formatDate(item?.value?.createdAt)}

        <div class="flex flex-row gap-[8px] ml-[24px]">
          <Avatar small>{item?.value?.createdBy[0]}</Avatar>
          {item?.value?.createdBy}
        </div>
      </div>
    </InfoGridValue>

    <InfoGridValue label="Aktualizováno">
      <div class="flex flex-row">
        {formatDate(item?.value?.updatedAt) ?? "-"}

        {#if item?.value?.updatedBy}
          <div class="flex flex-row gap-[8px] ml-[24px]">
            <Avatar small>{item?.value?.updatedBy[0]}</Avatar>
            {item?.value?.updatedBy}
          </div>
        {/if}
      </div>
    </InfoGridValue>
  </InfoGrid>
  <Divider />

  <form {onsubmit} id="enum-values-edit" novalidate>
    <label for="enabled">
      <Text font="body-bold-small">Stav</Text>
      <div class="flex flex-row items-center gap-[12px] ml-auto">
        <Text font="body-bold-small" color={enabled ? "primary" : "secondary"}>
          {enabled ? "Aktivní" : "Neaktivní"}
        </Text>
        <Switch bind:checked={enabled} id="enabled" name="enabled" value="enabled" />
      </div>
    </label>

    <Divider />

    <div class="p-[20px]">
      <Input
        id="name"
        name="name"
        label="Hodnota"
        value={item?.value?.name}
        error={errors.name}
        on:input={() => {
          delete errors.name;
        }}
        required
      />
    </div>
  </form>
</Sheet>

<style lang="scss">
  label {
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;

    margin: 12px;
    padding: 12px;

    border-radius: var(--medium);

    cursor: pointer;

    transition-property: background-color;

    &:hover {
      background-color: var(--background-light);
    }
  }
</style>
