<script lang="ts">
  import { authClient } from "$lib/auth/auth-client.svelte";
  import { Role } from "$lib/auth/roles";
  import Button from "$lib/components/button.svelte";
  import Checkbox from "$lib/components/checkbox.svelte";
  import Divider from "$lib/components/divider.svelte";
  import FieldAffix from "$lib/components/field-affix.svelte";
  import FieldGrid from "$lib/components/field-grid.svelte";
  import FileUpload from "$lib/components/file-upload.svelte";
  import Icon from "$lib/components/icon.svelte";
  import Input from "$lib/components/input.svelte";
  import Select from "$lib/components/select.svelte";
  import Sheet from "$lib/components/sheet.svelte";
  import Tab from "$lib/components/tab.svelte";
  import Tabs from "$lib/components/tabs.svelte";
  import Text from "$lib/components/text.svelte";
  import Textarea from "$lib/components/textarea.svelte";
  import { inputDateToISO, numeric } from "$lib/format";
  import { resource } from "$lib/resource";
  import { stack } from "$lib/stack.svelte";
  import { toast } from "$lib/toast.svelte";
  import { faCircleNotch, faFile, faTimes } from "@fortawesome/free-solid-svg-icons";
  import { fade } from "svelte/transition";
  import { coursesClient } from "./courses-client";

  let meta = coursesClient.meta();
  let locations = $derived(
    meta.value?.locations.filter((it) => authClient.identity.canUseLocation(Role.Dispecink, it.id)),
  );

  let source = $derived(stack.create ? coursesClient.get(Number(stack.create)) : undefined);

  let sheet = $state<{ scrollToTop(): void } | undefined>(undefined);
  let tab = $state<"course" | "departure" | "arrival">("course");

  let departureFileList = $state<File[]>([]);
  let arrivalFileList = $state<File[]>([]);

  function addFiles(list: File[], e: Event & { currentTarget: HTMLInputElement }) {
    let input = e.currentTarget;
    let files = input.files;
    if (!files) {
      return;
    }

    list.push(...files);
    input.value = "";
  }

  function removeFile(list: File[], ix: number) {
    list.splice(ix, 1);
  }

  let errors = $state<Record<string, string>>({});
  function validate(data: FormData) {
    errors = {};

    let departureDate = inputDateToISO(data.get("departureDate") as string);
    if (!departureDate) {
      errors.departureDate = resource.formError("required");
    }

    for (let required of ["locationId", "courseCode", "network", "transporterEnumId"]) {
      if (!data.get(required)) {
        errors[required] = resource.formError("required");
      }
    }

    let fixedNumerics = ["departureLoad", "arrivalLoad"];
    for (let key of fixedNumerics) {
      let value = data.get(key) as string;
      if (value && !numeric.test(value)) {
        errors[key] = resource.formError("numericPositive");
      }
    }

    for (let [key, value] of data) {
      if (
        key.startsWith("departure-load-amount") ||
        key.startsWith("departure-crate-amount") ||
        key.startsWith("arrival-load-amount") ||
        key.startsWith("arrival-crate-amount")
      ) {
        if (value && !numeric.test(value as string)) {
          errors[key] = resource.formError("numericPositive");
        }
      }
    }

    for (let departureFile of departureFileList) {
      data.append("departureFiles", departureFile);
    }

    for (let arrivalFile of arrivalFileList) {
      data.append("arrivalFiles", arrivalFile);
    }

    return Object.keys(errors).length > 0 ? undefined : data;
  }

  let more = $state(false);
  let submitting = $state(false);
  async function onsubmit(e: Event & { currentTarget: HTMLFormElement }) {
    e.preventDefault();

    let form = e.currentTarget;
    let data = new FormData(form);
    let payload = validate(data);
    if (!payload) {
      return;
    }

    submitting = true;

    try {
      await coursesClient.create(payload);
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

    submitting = false;
  }
</script>

<Sheet bind:this={sheet} title="Nový záznam" onclose={() => stack.closeCreate()}>
  {#snippet sticky()}
    <Tabs>
      <Tab
        onclick={() => {
          tab = "course";
          sheet?.scrollToTop();
        }}
        active={tab === "course"}
        stretch
      >
        Kurz
      </Tab>
      <Tab
        onclick={() => {
          tab = "departure";
          sheet?.scrollToTop();
        }}
        active={tab === "departure"}
        stretch
      >
        Odjezd
      </Tab>
      <Tab
        onclick={() => {
          tab = "arrival";
          sheet?.scrollToTop();
        }}
        active={tab === "arrival"}
        stretch
      >
        Příjezd
      </Tab>
    </Tabs>
    <Divider />
  {/snippet}

  {#snippet footer()}
    <div class="mr-auto">
      {#if submitting}
        <div class="flex flex-row justify-start items-center gap-[16px] mr-auto">
          <Icon icon={faCircleNotch} spin />
          <Text color="primary">Nahrávam soubory</Text>
        </div>
      {:else}
        <Checkbox bind:checked={more} label="Vytvořit další záznam" disabled={submitting} />
      {/if}
    </div>
    <Button onclick={() => stack.closeCreate()} variant="outlined">Zavřít</Button>
    <Button form="courses-create" type="submit" variant="primary">Vytvořit</Button>
  {/snippet}

  <form {onsubmit} id="courses-create" novalidate>
    <div class="contents" class:hidden={tab !== "course"}>
      <FieldGrid cols={2} offset>
        <span class="col-span-2">
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
            disabled={submitting}
            required
          />
        </span>

        <Input
          id="courseCode"
          name="courseCode"
          label="Číslo kurzu"
          error={errors.courseCode}
          on:input={() => {
            delete errors.courseCode;
          }}
          required
        />
        <Input
          id="departureDate"
          name="departureDate"
          type="date"
          label="Datum odjezdu"
          error={errors.departureDate}
          on:input={() => {
            delete errors.departureDate;
          }}
          required
        />

        <Select
          id="network"
          name="network"
          label="Síť"
          value={source?.value?.network}
          options={["hps", "obps", "ups"].map((it) => ({ value: it, label: resource.transportNetwork(it) }))}
          error={errors.network}
          on:change={() => {
            delete errors.network;
          }}
          disabled={submitting}
          required
        />
        <Select
          id="transporterEnumId"
          name="transporterEnumId"
          label="Dopravce"
          value={source?.value?.transporterEnumId}
          error={errors.transporterEnumId}
          options={meta.value?.transporters.map((it) => ({ value: it.id, label: it.name }))}
          on:change={() => {
            delete errors.transporterEnumId;
          }}
          disabled={submitting}
          required
        />

        <span class="col-span-2">
          <Textarea
            id="seals"
            name="seals"
            label="Plomby"
            error={errors.seals}
            on:input={() => {
              delete errors.seals;
            }}
          />
        </span>
      </FieldGrid>
    </div>

    <div class="contents" class:hidden={tab !== "departure"}>
      <FieldGrid cols={2} title="Odjezd kurzu" offset>
        <Input
          id="departurePlannedTime"
          name="departurePlannedTime"
          type="time"
          label="Plánovány odjezd"
          error={errors.departurePlannedTime}
          on:input={() => {
            delete errors.departurePlannedTime;
          }}
        />
        <Input
          id="departureRealTime"
          name="departureRealTime"
          type="time"
          label="Skutečný odjezd"
          error={errors.realDepartureTime}
          on:input={() => {
            delete errors.realDepartureTime;
          }}
        />

        <span class="col-span-2">
          <Select
            id="departureDelayReasonEnumId"
            name="departureDelayReasonEnumId"
            label="Příčina zpoždění"
            options={meta.value?.delayReasons.map((it) => ({ value: it.id, label: it.name }))}
            error={errors.departureDelayReasonEnumId}
            on:change={() => {
              delete errors.departureDelayReasonEnumId;
            }}
            disabled={submitting}
          />
        </span>

        <span class="col-span-2">
          <Textarea
            id="departureNote"
            name="departureNote"
            label="Poznámka"
            error={errors.departureNote}
            on:input={() => {
              delete errors.departureNote;
            }}
          />
        </span>

        <span class="col-span-2">
          <Input
            id="departureLoad"
            name="departureLoad"
            label="Vytížení"
            error={errors.departureLoad}
            on:input={() => {
              delete errors.departureLoad;
            }}
            right
          >
            <FieldAffix slot="tail" dense>%</FieldAffix>
          </Input>
        </span>
      </FieldGrid>

      <Divider />

      <FieldGrid title="Přílohy" offset>
        <FileUpload oninput={(e) => addFiles(departureFileList, e)} disabled={submitting} />

        <div class="flex flex-col gap-[8px]">
          {#each departureFileList as file, i (i)}
            <div
              transition:fade={{ duration: 250 }}
              class="file flex flex-row justify-start items-center gap-[12px] p-[12px]"
            >
              <Icon icon={faFile} />
              <Text>{file.name}</Text>
              <div class="ml-auto">
                <Button
                  onclick={() => removeFile(departureFileList, i)}
                  type="button"
                  icon={faTimes}
                  variant="ghost"
                  small
                  disabled={submitting}
                />
              </div>
            </div>
          {/each}
        </div>
      </FieldGrid>

      <Divider />

      {#each meta.value?.technologicalGroups ?? [] as group (group.value)}
        <div class="p-[20px]">
          <div class="mb-[24px]">
            <Text font="subheadline-bold">{resource.technologicalGroup(group.value)}</Text>
          </div>

          <div class="grid grid-cols-3 gap-x-[16px] gap-y-[24px] mt-[24px]">
            <Input
              id="departure-load-amount-{group.value}"
              name="departure-load-amount-{group.value}"
              label="Počet"
              inputmode="numeric"
              error={errors[`departure-load-amount-${group.value}`]}
              on:input={() => {
                delete errors[`departure-load-amount-${group.value}`];
              }}
              disabled={submitting}
              right
            >
              <FieldAffix slot="tail">{group.unit}</FieldAffix>
            </Input>
            <div class="col-span-2">
              <Input
                id="departure-load-note-{group.value}"
                name="departure-load-note-{group.value}"
                label="Poznámka"
                disabled={submitting}
              />
            </div>

            {#each group.crates as crate (crate.crate)}
              <Input
                id="departure-crate-amount-{group.value}:{crate.crate}"
                name="departure-crate-amount-{group.value}:{crate.crate}"
                inputmode="numeric"
                error={errors[`departure-crate-amount-${group.value}:${crate.crate}`]}
                on:input={() => {
                  delete errors[`departure-crate-amount-${group.value}:${crate.crate}`];
                }}
                disabled={submitting}
                right
              >
                <FieldAffix slot="lead" dense>{resource.crate(crate.crate)}</FieldAffix>
              </Input>
            {/each}
          </div>
        </div>

        <Divider />
      {/each}

      <FieldGrid title="Ostatní" offset>
        <Textarea id="departureOther" name="departureOther" label="Ostatní" disabled={submitting} />
      </FieldGrid>
    </div>

    <div class="contents" class:hidden={tab !== "arrival"}>
      <FieldGrid cols={2} title="Příjezd kurzu" offset>
        <Input
          id="arrivalPlannedTime"
          name="arrivalPlannedTime"
          type="time"
          label="Plánovány příjezd"
          error={errors.arrivalPlannedTime}
          on:input={() => {
            delete errors.arrivalPlannedTime;
          }}
        />
        <Input
          id="arrivalRealTime"
          name="arrivalRealTime"
          type="time"
          label="Skutečný příjezd"
          error={errors.realDepartureTime}
          on:input={() => {
            delete errors.arrivalRealTime;
          }}
        />

        <span class="col-span-2">
          <Select
            id="arrivalDelayReasonEnumId"
            name="arrivalDelayReasonEnumId"
            label="Příčina zpoždění"
            options={meta.value?.delayReasons.map((it) => ({ value: it.id, label: it.name }))}
            error={errors.arrivalDelayReasonEnumId}
            on:change={() => {
              delete errors.arrivalDelayReasonEnumId;
            }}
            disabled={submitting}
          />
        </span>

        <span class="col-span-2">
          <Textarea
            id="arrivalNote"
            name="arrivalNote"
            label="Poznámka"
            error={errors.arrivalNote}
            on:input={() => {
              delete errors.arrivalNote;
            }}
          />
        </span>

        <span class="col-span-2">
          <Input
            id="arrivalLoad"
            name="arrivalLoad"
            label="Vytížení"
            error={errors.arrivalLoad}
            on:input={() => {
              delete errors.arrivalLoad;
            }}
            right
          >
            <FieldAffix slot="tail" dense>%</FieldAffix>
          </Input>
        </span>
      </FieldGrid>

      <Divider />

      <FieldGrid title="Přílohy" offset>
        <FileUpload oninput={(e) => addFiles(arrivalFileList, e)} disabled={submitting} />

        <div class="flex flex-col gap-[8px]">
          {#each arrivalFileList as file, i (i)}
            <div
              transition:fade={{ duration: 250 }}
              class="file flex flex-row justify-start items-center gap-[12px] p-[12px]"
            >
              <Icon icon={faFile} />
              <Text>{file.name}</Text>
              <div class="ml-auto">
                <Button
                  onclick={() => removeFile(arrivalFileList, i)}
                  type="button"
                  icon={faTimes}
                  variant="ghost"
                  small
                  disabled={submitting}
                />
              </div>
            </div>
          {/each}
        </div>
      </FieldGrid>

      <Divider />

      {#each meta.value?.technologicalGroups ?? [] as group (group.value)}
        <div class="p-[20px]">
          <div class="mb-[24px]">
            <Text font="subheadline-bold">{resource.technologicalGroup(group.value)}</Text>
          </div>

          <div class="grid grid-cols-3 gap-x-[16px] gap-y-[24px] mt-[24px]">
            <Input
              id="arrival-load-amount-{group.value}"
              name="arrival-load-amount-{group.value}"
              label="Počet"
              inputmode="numeric"
              error={errors[`arrival-load-amount-${group.value}`]}
              on:input={() => {
                delete errors[`arrival-load-amount-${group.value}`];
              }}
              disabled={submitting}
              right
            >
              <FieldAffix slot="tail">{group.unit}</FieldAffix>
            </Input>
            <div class="col-span-2">
              <Input
                id="arrival-load-note-{group.value}"
                name="arrival-load-note-{group.value}"
                label="Poznámka"
                disabled={submitting}
              />
            </div>

            {#each group.crates as crate (crate.crate)}
              <Input
                id="arrival-crate-amount-{group.value}:{crate.crate}"
                name="arrival-crate-amount-{group.value}:{crate.crate}"
                inputmode="numeric"
                error={errors[`arrival-crate-amount-${group.value}:${crate.crate}`]}
                on:input={() => {
                  delete errors[`arrival-crate-amount-${group.value}:${crate.crate}`];
                }}
                disabled={submitting}
                right
              >
                <FieldAffix slot="lead" dense>{resource.crate(crate.crate)}</FieldAffix>
              </Input>
            {/each}
          </div>
        </div>

        <Divider />
      {/each}

      <FieldGrid title="Ostatní" offset>
        <Textarea id="arrivalOther" name="arrivalOther" label="Ostatní" disabled={submitting} />
      </FieldGrid>
    </div>
  </form>
</Sheet>

<style lang="scss">
  .file {
    background-color: var(--backdrop);

    border-radius: var(--small);
  }
</style>
