<script lang="ts">
  import { ApiError } from "$lib/api/api-error";
  import type { TechnologicalGroup } from "$lib/api/technological-groups";
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
  import Tab from "$lib/components/tab.svelte";
  import Tabs from "$lib/components/tabs.svelte";
  import Text from "$lib/components/text.svelte";
  import Textarea from "$lib/components/textarea.svelte";
  import { createId } from "$lib/create-id";
  import { formatDate, formatDateInput, formatDateTime, formatTime, numeric } from "$lib/format";
  import { resource } from "$lib/resource";
  import { stack } from "$lib/stack.svelte";
  import { toast } from "$lib/toast.svelte";
  import { faClone, faPlus, faTimes, faTrashAlt } from "@fortawesome/free-solid-svg-icons";
  import { irregularCoursesClient } from "./irregular-courses-client";

  let meta = irregularCoursesClient.meta();
  let item = $derived(stack.view ? irregularCoursesClient.get(Number(stack.view)) : undefined);
  let locations = $derived(
    meta.value?.locations.filter((it) => authClient.identity.canUseLocation(Role.Dispecink, it.id)),
  );

  let canEdit = $derived(
    item?.value?.locationId ? authClient.identity.canUseLocation(Role.Dispecink, item?.value?.locationId) : false,
  );

  let sheet = $state<{ scrollToTop(): void } | undefined>(undefined);
  let tab = $state<"general" | "package" | "letter" | "other">("general");

  let stops = $state<{ id: string; value: string }[]>([{ id: createId(), value: "" }]);
  $effect(() => {
    if (item?.value?.stops) {
      stops = item.value.stops.map((it) => ({ id: createId(), value: it.stopName }));
    }
  });

  function addStop() {
    stops.push({ id: createId(), value: "" });
  }

  function removeStop(id: string) {
    let ix = stops.findIndex((it) => it.id === id);
    if (ix > -1) {
      stops.splice(ix, 1);
    }
  }

  let errors = $state<Record<string, string>>({});
  function validate(data: FormData) {
    errors = {};

    let required = [
      "locationId",
      "initialStop",
      "initialStopDate",
      "initialStopTime",
      "finalStop",
      "finalStopDate",
      "finalStopTime",
      "network",
      "transporter",
      "vehiclePlate",
    ];
    for (let key of required) {
      if (!data.get(key)) {
        errors[key] = resource.formError("required");
      }
    }

    let fixedNumerics = ["distance", "load"];
    for (let key of fixedNumerics) {
      let value = data.get(key) as string;
      if (value && !numeric.test(value)) {
        errors[key] = resource.formError("numericPositive");
      }
    }

    for (let [key, value] of data) {
      if (key.startsWith("load-amount") || key.startsWith("crate-amount")) {
        if (value && !numeric.test(value as string)) {
          errors[key] = resource.formError("numericPositive");
        }
      }
    }

    return Object.keys(errors).length > 0 ? undefined : data;
  }

  let submitting = $state(false);
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

    submitting = true;

    let stopsPayload: string[] = [];
    let loads = new Map<string, { technologicalGroup: string; amount: number | undefined; note: string | undefined }>();
    let crates: { technologicalGroup: string; crate: string; amount: number }[] = [];
    for (let [key, value] of payload) {
      if (key.startsWith("stop-") && value) {
        stopsPayload.push(value as string);
        continue;
      }

      if (key.startsWith("load-")) {
        let technologicalGroup = key.replace("load-amount-", "").replace("load-note-", "");
        let amount = payload.get(`load-amount-${technologicalGroup}`);
        let note = payload.get(`load-note-${technologicalGroup}`);

        if (amount || note) {
          loads.set(technologicalGroup, {
            technologicalGroup,
            amount: amount ? Number(amount) : undefined,
            note: note ? (note as string) : undefined,
          });
        }
        continue;
      }

      if (key.startsWith("crate-") && value) {
        let [technologicalGroup, crate] = key.replace("crate-amount-", "").split(":");
        crates.push({ technologicalGroup, crate, amount: Number(value) });
        continue;
      }
    }

    try {
      await irregularCoursesClient.update(item.value.id, {
        ...Object.fromEntries(payload.entries()),
        stops: stopsPayload,
        loads: [...loads.values()],
        crates,
      });
      toast.success("Záznam aktualizován.");

      stack.closeView();
    } catch (err) {
      console.error(err);

      if (err instanceof ApiError && err.status === 409) {
        if (Array.isArray(err.response?.detail)) {
          err.response.detail.forEach((it: string) => {
            if (it === "enum::vehicle-plate") {
              errors.vehiclePlate = resource.formError("disallowed");
            } else if (it === "enum::trailer-plate") {
              errors.trailerPlate = resource.formError("disallowed");
            } else {
              errors[it] = resource.formError("disallowed");
            }
          });
        }

        toast.error("Některé údaje není možno použít.");
      } else {
        toast.error("Aktualizace selhala.");
      }
    }

    submitting = false;
  }
</script>

<Sheet bind:this={sheet} title="{canEdit ? 'Úprava' : 'Náhled'} záznamu" onclose={() => stack.closeView()}>
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

  {#snippet sticky()}
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
      {/if}
    </InfoGrid>

    <Tabs>
      <Tab
        onclick={() => {
          tab = "general";
          sheet?.scrollToTop();
        }}
        active={tab === "general"}
        stretch
      >
        Základní údaje
      </Tab>
      <Tab
        onclick={() => {
          tab = "package";
          sheet?.scrollToTop();
        }}
        active={tab === "package"}
        stretch
      >
        Balíky
      </Tab>
      <Tab
        onclick={() => {
          tab = "letter";
          sheet?.scrollToTop();
        }}
        active={tab === "letter"}
        stretch
      >
        Listovka
      </Tab>
      <Tab
        onclick={() => {
          tab = "other";
          sheet?.scrollToTop();
        }}
        active={tab === "other"}
        stretch
      >
        Ostatní
      </Tab>
    </Tabs>
    <Divider />
  {/snippet}

  {#snippet footer()}
    <Button onclick={() => stack.closeView()} variant="outlined" disabled={submitting}>Zavřít</Button>
    {#if canEdit}
      <Button form="irregular-courses-edit" type="submit" variant="primary" disabled={submitting}>Uložit</Button>
    {/if}
  {/snippet}

  {#if canEdit}
    <form {onsubmit} id="irregular-courses-edit" novalidate>
      <div class="contents" class:hidden={tab !== "general"}>
        <div class="py-[24px] px-[20px]">
          <Select
            id="locationId"
            name="locationId"
            label="DSPU"
            value={item?.value?.locationId}
            options={locations?.map((it) => ({
              value: it.id,
              label: it.name,
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

        <div class="grid grid-cols-2 gap-x-[16px] gap-y-[24px] px-[20px] py-[24px]">
          <div class="col-span-2">
            <Text font="subheadline-bold-large">Začátek</Text>
          </div>

          <div class="col-span-2">
            <Select
              id="initialStop"
              name="initialStop"
              label="Počáteční zastávka"
              value={item?.value?.initialStop}
              options={meta.value?.stopLocations.map((it) => ({
                value: it.id,
                label: it.name,
              }))}
              error={errors.initialStop}
              on:change={() => {
                delete errors.initialStop;
              }}
              disabled={submitting}
              required
            />
          </div>

          <Input
            id="initialStopDate"
            name="initialStopDate"
            type="date"
            label="Datum"
            value={formatDateInput(item?.value?.initialStopDate)}
            error={errors.initialStopDate}
            on:input={() => {
              delete errors.initialStopDate;
            }}
            disabled={submitting}
            required
          />
          <Input
            id="initialStopTime"
            name="initialStopTime"
            type="time"
            label="Čas"
            value={item?.value?.initialStopTime}
            error={errors.initialStopTime}
            on:input={() => {
              delete errors.initialStopTime;
            }}
            disabled={submitting}
            required
          />
        </div>
        <Divider />

        <div class="flex flex-col justify-start items-stretch gap-[24px] px-[20px] py-[24px]">
          <Text font="subheadline-bold-large">Zastávky</Text>

          {#each stops as stop (stop.id)}
            <div class="flex flex-row justify-start items-center gap-[4px]">
              <div class="flex-1">
                <Input
                  id="stop-{stop.id}"
                  name="stop-{stop.id}"
                  placeholder="Zastávka"
                  list="stops"
                  autocomplete="off"
                  value={stop.value}
                  error={errors[`stop-${stop.id}`]}
                  on:input={() => {
                    delete errors[`stop-${stop.id}`];
                  }}
                  disabled={submitting}
                />
              </div>
              <Button
                onclick={() => removeStop(stop.id)}
                type="button"
                icon={faTimes}
                variant="ghost"
                disabled={submitting}
              />
            </div>
          {/each}

          <Button onclick={() => addStop()} type="button" icon={faPlus} variant="ghost" disabled={submitting}>
            Přidat zástavku
          </Button>

          <datalist id="stops">
            {#each meta.value?.stops ?? [] as item (item.name)}
              <option value={item.name}>{item.name}</option>
            {/each}
          </datalist>
        </div>
        <Divider />

        <div class="grid grid-cols-2 gap-x-[16px] gap-y-[24px] px-[20px] py-[24px]">
          <div class="col-span-2">
            <Text font="subheadline-bold-large">Konec</Text>
          </div>

          <div class="col-span-2">
            <Select
              id="finalStop"
              name="finalStop"
              label="Koneční zastávka"
              value={item?.value?.finalStop}
              options={meta.value?.stopLocations.map((it) => ({
                value: it.id,
                label: it.name,
              }))}
              error={errors.finalStop}
              on:change={() => {
                delete errors.finalStop;
              }}
              disabled={submitting}
              required
            />
          </div>

          <Input
            id="finalStopDate"
            name="finalStopDate"
            type="date"
            label="Datum"
            value={formatDateInput(item?.value?.finalStopDate)}
            error={errors.finalStopDate}
            on:input={() => {
              delete errors.finalStopDate;
            }}
            disabled={submitting}
            required
          />
          <Input
            id="finalStopTime"
            name="finalStopTime"
            type="time"
            label="Čas"
            value={item?.value?.finalStopTime}
            error={errors.finalStopTime}
            on:input={() => {
              delete errors.finalStopTime;
            }}
            disabled={submitting}
            required
          />
        </div>
        <Divider />

        <div class="grid grid-cols-6 gap-x-[16px] gap-y-[24px] px-[20px] py-[24px]">
          <div class="col-span-6">
            <Text font="subheadline-bold-large">Obecně</Text>
          </div>

          <div class="col-span-3">
            <Select
              id="network"
              name="network"
              label="Síť"
              value={item?.value?.network}
              options={["hps", "obps", "ups"].map((it) => ({
                value: it,
                label: resource.transportNetwork(it),
              }))}
              error={errors.network}
              on:change={() => {
                delete errors.network;
              }}
              disabled={submitting}
              required
            />
          </div>

          <div class="col-span-3">
            <Select
              id="transporter"
              name="transporter"
              label="Přepravce"
              value={item?.value?.transporter}
              options={meta.value?.transporters.map((it) => ({
                value: it.name,
                label: it.name,
              }))}
              error={errors.transporter}
              on:change={() => {
                delete errors.transporter;
              }}
              disabled={submitting}
              required
            />
          </div>

          <div class="col-span-2">
            <Input
              id="vehiclePlate"
              name="vehiclePlate"
              label="Vozidlo"
              list="vehiclePlates"
              value={item?.value?.vehiclePlate}
              error={errors.vehiclePlate}
              on:input={() => {
                delete errors.vehiclePlate;
              }}
              autocomplete="off"
              disabled={submitting}
              required
            />
            <datalist id="vehiclePlates">
              {#each meta.value?.vehiclePlates ?? [] as item (item.name)}
                <option value={item.name}>{item.name}</option>
              {/each}
            </datalist>
          </div>

          <div class="col-span-2">
            <Input
              id="trailerPlate"
              name="trailerPlate"
              label="Přip. vozidlo"
              list="trailerPlates"
              value={item?.value?.trailerPlate}
              error={errors.trailerPlate}
              on:input={() => {
                delete errors.trailerPlate;
              }}
              autocomplete="off"
              disabled={submitting}
            />
            <datalist id="trailerPlates">
              {#each meta.value?.trailerPlates ?? [] as item (item.name)}
                <option value={item.name}>{item.name}</option>
              {/each}
            </datalist>
          </div>

          <div class="col-span-2">
            <Input
              id="distance"
              name="distance"
              label="Vzdálenost"
              value={item?.value?.distance}
              error={errors.distance}
              on:input={() => {
                delete errors.distance;
              }}
              disabled={submitting}
              right
            >
              <InputAffix slot="tail">km</InputAffix>
            </Input>
          </div>

          <div class="col-span-6">
            <Textarea id="note" name="note" label="Poznámka" value={item?.value?.note} disabled={submitting} />
          </div>
        </div>
      </div>

      {#snippet field(group: TechnologicalGroup)}
        <div class="p-[20px]">
          <div class="mb-[24px]">
            <Text font="subheadline-bold">{resource.technologicalGroup(group.value)}</Text>
          </div>

          <div class="grid grid-cols-3 gap-x-[16px] gap-y-[24px] mt-[24px]">
            <Input
              id="load-amount-{group.value}"
              name="load-amount-{group.value}"
              label="Počet"
              inputmode="numeric"
              value={item?.value?.loads.find((it) => it.technologicalGroup === group.value)?.amount}
              error={errors[`load-amount-${group.value}`]}
              on:input={() => {
                delete errors[`load-amount-${group.value}`];
              }}
              disabled={submitting}
              right
            >
              <InputAffix slot="tail">{group.unit}</InputAffix>
            </Input>
            <div class="col-span-2">
              <Input
                id="load-note-{group.value}"
                name="load-note-{group.value}"
                label="Poznámka"
                value={item?.value?.loads.find((it) => it.technologicalGroup === group.value)?.note}
                disabled={submitting}
              />
            </div>

            {#each group.crates as crate (crate.crate)}
              <Input
                id="crate-amount-{group.value}:{crate.crate}"
                name="crate-amount-{group.value}:{crate.crate}"
                inputmode="numeric"
                value={item?.value?.crates.find(
                  (it) => it.technologicalGroup === group.value && it.crate === crate.crate,
                )?.amount}
                error={errors[`crate-amount-${group.value}:${crate.crate}`]}
                on:input={() => {
                  delete errors[`crate-amount-${group.value}:${crate.crate}`];
                }}
                disabled={submitting}
                right
              >
                <InputAffix slot="lead" dense>{resource.crate(crate.crate)}</InputAffix>
              </Input>
            {/each}
          </div>
        </div>

        <Divider />
      {/snippet}

      <div class="contents" class:hidden={tab !== "package"}>
        {#each meta.value?.technologicalGroups.filter((it) => it.group === "package") ?? [] as group (group.value)}
          {@render field(group)}
        {/each}
      </div>

      <div class="contents" class:hidden={tab !== "letter"}>
        {#each meta.value?.technologicalGroups.filter((it) => it.group === "letter") ?? [] as group (group.value)}
          {@render field(group)}
        {/each}
      </div>

      <div class:hidden={tab !== "other"}>
        <div class="flex flex-col justify-start items-stretch gap-[24px] px-[20px] py-[24px]">
          <Text font="subheadline-bold-large">Ostatní</Text>

          <Textarea id="other" name="other" label="Ostatní" value={item?.value?.otherLoad} disabled={submitting} />

          <Input
            id="load"
            name="load"
            label="Vytížení"
            value={item?.value?.load}
            error={errors.load}
            on:input={() => {
              delete errors.load;
            }}
            disabled={submitting}
            right
          >
            <InputAffix slot="tail">%</InputAffix>
          </Input>
        </div>
      </div>
    </form>
  {:else if tab === "general"}
    <InfoGrid title="Začátek">
      <InfoGridValue label="Počáteční zastávka">
        {item?.value?.initialStop}
      </InfoGridValue>
      <InfoGridValue label="Datum">
        {formatDate(item?.value?.initialStopDate)}
      </InfoGridValue>
      <InfoGridValue label="Čas">
        {formatTime(item?.value?.initialStopTime)}
      </InfoGridValue>
    </InfoGrid>

    <Divider />

    <div class="flex flex-col justify-start items-stretch gap-[16px] px-[20px] py-[24px]">
      <Text font="subheadline-bold">Zastávky</Text>

      {#each item?.value?.stops ?? [] as stop (stop.sequence)}
        <div class="stop">{stop.stopName}</div>
      {/each}
    </div>

    <Divider />

    <InfoGrid title="Konec">
      <InfoGridValue label="Koneční zastávka">
        {item?.value?.finalStop}
      </InfoGridValue>
      <InfoGridValue label="Datum">
        {formatDate(item?.value?.finalStopDate)}
      </InfoGridValue>
      <InfoGridValue label="Čas">
        {formatTime(item?.value?.finalStopTime)}
      </InfoGridValue>
    </InfoGrid>

    <Divider />

    <InfoGrid title="Obecně">
      <InfoGridValue label="Síť">
        {resource.transportNetwork(item?.value?.network ?? "")}
      </InfoGridValue>
      <InfoGridValue label="Přepravce">
        {item?.value?.transporter}
      </InfoGridValue>
      <InfoGridValue label="Vozidlo">
        {item?.value?.vehiclePlate}
      </InfoGridValue>
      <InfoGridValue label="Přip. vozidlo">
        {item?.value?.trailerPlate}
      </InfoGridValue>
      <InfoGridValue label="Vzdálenost">
        {item?.value?.distance ?? "-"}
        <Text element="span" color="secondary">km</Text>
      </InfoGridValue>
      <InfoGridValue label="Poznámka">
        {item?.value?.note}
      </InfoGridValue>
    </InfoGrid>
  {:else if tab === "package" || tab === "letter"}
    {#each meta.value?.technologicalGroups.filter((it) => it.group === tab) ?? [] as group, ix (group.value)}
      {@const row = item?.value?.loads.find((it) => it.technologicalGroup === group.value)}
      {#if ix !== 0}
        <Divider />
      {/if}

      <InfoGrid title={resource.technologicalGroup(group.value)}>
        <InfoGridValue label="Počet">
          {row?.amount ?? "-"}
          <Text element="span" color="secondary">{group.unit}</Text>
        </InfoGridValue>
        <InfoGridValue label="Poznámka">{row?.note ?? "-"}</InfoGridValue>

        {#each group.crates as crate (crate.crate)}
          <InfoGridValue label={resource.crate(crate.crate)}>
            {item?.value?.crates.find((it) => it.technologicalGroup === group.value && it.crate === crate.crate)
              ?.amount ?? "-"}
          </InfoGridValue>
        {/each}
      </InfoGrid>
    {/each}
  {:else if tab === "other"}
    <InfoGrid>
      <InfoGridValue label="Ostatní">
        {item?.value?.otherLoad ?? "-"}
      </InfoGridValue>

      <InfoGridValue label="Vytížení">
        {item?.value?.load ?? "-"} %
      </InfoGridValue>
    </InfoGrid>
  {/if}
</Sheet>

<style lang="scss">
  .stop {
    padding: 8px 16px;

    border-left: 1px solid var(--border-light);
  }
</style>
