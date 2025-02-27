<script lang="ts">
  import { authClient } from "$lib/auth/auth-client.svelte";
  import { Role } from "$lib/auth/roles";
  import Button from "$lib/components/button.svelte";
  import Divider from "$lib/components/divider.svelte";
  import InfoGridValue from "$lib/components/info-grid-value.svelte";
  import InfoGrid from "$lib/components/info-grid.svelte";
  import InputAffix from "$lib/components/input-affix.svelte";
  import Input from "$lib/components/input.svelte";
  import Sheet from "$lib/components/sheet.svelte";
  import Text from "$lib/components/text.svelte";
  import { formatDate, formatDateTime, numeric } from "$lib/format";
  import { resource } from "$lib/resource";
  import { stack } from "$lib/stack.svelte";
  import { toast } from "$lib/toast.svelte";
  import { faTrashAlt } from "@fortawesome/free-solid-svg-icons";
  import { machiningsClient } from "./machinings-client";
  import Avatar from "$lib/components/avatar.svelte";

  let meta = machiningsClient.meta();
  let item = $derived(stack.view ? machiningsClient.get(Number(stack.view)) : undefined);

  let canEdit = $derived(
    item?.value?.locationId ? authClient.identity.canUseLocation(Role.Dispecink, item.value.locationId) : false,
  );

  let errors = $state<Record<string, string>>({});
  function validate(data: FormData) {
    errors = {};

    for (let [key, value] of data) {
      if (key.startsWith("amount-") && value) {
        if (!numeric.test(value as string)) {
          errors[key] = resource.formError("numericPositive");
        }
      }
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
      await machiningsClient.update(
        item?.value?.id,
        meta.value?.machines
          .map((it) => ({
            machine: it.value,
            value: ((payload.get(`amount-${it.value}`) as string) ?? "").replaceAll(",", ".").trim(),
            note: (payload.get(`note-${it.value}`) as string) ?? "",
          }))
          .filter((it) => it.value || it.note),
      );
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
      <Button type="submit" form="machinings-edit" variant="primary">Uložit</Button>
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

    <InfoGridValue label="Datum">{formatDate(item?.value?.dateFor)}</InfoGridValue>
    <InfoGridValue label="DSPU">{item?.value?.locationName}</InfoGridValue>
  </InfoGrid>

  {#if !canEdit}
    {#each item?.value?.machines ?? [] as machine (machine.machine)}
      <Divider />
      <InfoGrid title={resource.machine(machine.machine)}>
        <InfoGridValue label="Výkon">{machine.value ?? "-"}</InfoGridValue>
        <InfoGridValue label="Poznámka">{machine.note}</InfoGridValue>
      </InfoGrid>
    {/each}
  {/if}

  {#if canEdit}
    <Divider />
    <form {onsubmit} id="machinings-edit" novalidate>
      <div class="grid grid-cols-[190px_auto] gap-x-[16px] gap-y-[24px] p-[20px]">
        <Text font="buttom-medium">Výkon</Text>
        <Text font="buttom-medium">Poznámka</Text>
        {#each item?.value?.machines ?? [] as machine (machine.machine)}
          <Input
            id="amount-{machine.machine}"
            name="amount-{machine.machine}"
            value={`${machine.value ?? ""}`}
            inputmode="numeric"
            error={errors[`amount-${machine.machine}`]}
            on:input={() => {
              delete errors[`amount-${machine.machine}`];
            }}
            right
          >
            <InputAffix slot="lead" dense>{resource.machine(machine.machine)}</InputAffix>
          </Input>

          <Input name="note-{machine.machine}" value={machine.note ?? ""} />
        {/each}
      </div>
    </form>
  {/if}
</Sheet>
