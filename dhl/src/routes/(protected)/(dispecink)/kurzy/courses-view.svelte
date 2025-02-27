<script lang="ts">
  import { authClient } from "$lib/auth/auth-client.svelte";
  import { Role } from "$lib/auth/roles";
  import Avatar from "$lib/components/avatar.svelte";
  import Button from "$lib/components/button.svelte";
  import Divider from "$lib/components/divider.svelte";
  import FieldAffix from "$lib/components/field-affix.svelte";
  import FieldGrid from "$lib/components/field-grid.svelte";
  import FileUpload from "$lib/components/file-upload.svelte";
  import Icon from "$lib/components/icon.svelte";
  import InfoGridValue from "$lib/components/info-grid-value.svelte";
  import InfoGrid from "$lib/components/info-grid.svelte";
  import Input from "$lib/components/input.svelte";
  import Select from "$lib/components/select.svelte";
  import Sheet from "$lib/components/sheet.svelte";
  import Tab from "$lib/components/tab.svelte";
  import Tabs from "$lib/components/tabs.svelte";
  import Text from "$lib/components/text.svelte";
  import Textarea from "$lib/components/textarea.svelte";
  import { formatDate, formatDateInput, formatDateTime, inputDateToISO, numeric, formatTime } from "$lib/format";
  import { resource } from "$lib/resource";
  import { stack } from "$lib/stack.svelte";
  import { toast } from "$lib/toast.svelte";
  import { faCircleNotch, faClone, faFile, faSpinner, faTrashAlt } from "@fortawesome/free-solid-svg-icons";
  import { fade } from "svelte/transition";
  import { coursesClient } from "./courses-client";
  import Badge from "$lib/components/badge.svelte";
  import EnumValuesCreate from "../../(admin)/ciselniky/[key]/enum-values-create.svelte";

  let meta = coursesClient.meta();
  let item = $derived(stack.view ? coursesClient.get(Number(stack.view)) : undefined);
  let locations = $derived(
    meta.value?.locations.filter((it) => authClient.identity.canUseLocation(Role.Dispecink, it.id)),
  );

  let canEdit = $derived(
    item?.value?.locationId ? authClient.identity.canUseLocation(Role.Dispecink, item.value.locationId) : false,
  );

  let sheet = $state<{ scrollToTop(): void } | undefined>(undefined);
  let tab = $state<"course" | "departure" | "arrival">("course");

  let departureFileList = $state<File[]>([]);
  let arrivalFileList = $state<File[]>([]);

  async function addFiles(group: "departure" | "arrival", e: Event & { currentTarget: HTMLInputElement }) {
    if (!item?.value) {
      return;
    }

    let input = e.currentTarget;
    let files = input.files;
    if (!files) {
      return;
    }

    if (group === "departure") {
      departureFileList = [...files];
    } else {
      arrivalFileList = [...files];
    }
    for (let file of files) {
      let data = new FormData();
      data.append(group === "departure" ? "departureFiles" : "arrivalFiles", file);

      try {
        let res = await coursesClient.uploadFiles(item.value.id, data);
        item.value.files = res.files;
        if (group === "departure") {
          departureFileList = departureFileList.filter((it) => it.name !== file.name);
        } else {
          arrivalFileList = arrivalFileList.filter((it) => it.name !== file.name);
        }
      } catch (err) {
        console.error(err);
      }
    }

    input.value = "";
  }

  async function removeFile(filename: string) {
    if (!item?.value) {
      return;
    }

    try {
      let res = await coursesClient.removeFile(item.value.id, filename);
      item.value.files = res.files;
    } catch (err) {
      console.error(err);
    }
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

    try {
      await coursesClient.update(item.value.id, Object.fromEntries(payload.entries()));
      toast.success("Záznam aktualizován.");

      stack.closeView();
    } catch (err) {
      console.error(err);
      toast.error("Aktualizace selhala.");
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

      {#if !canEdit}{/if}
    </InfoGrid>

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
      {/if}
    </div>
    <Button onclick={() => stack.closeView()} variant="outlined" disabled={submitting}>Zavřít</Button>
    {#if canEdit}
      <Button form="courses-edit" type="submit" variant="primary" disabled={submitting}>Uložit</Button>
    {/if}
  {/snippet}

  {#if canEdit}
    <form {onsubmit} id="courses-edit" novalidate>
      <div class="contents" class:hidden={tab !== "course"}>
        <FieldGrid cols={2} offset>
          <span class="col-span-2">
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
              disabled={submitting}
              required
            />
          </span>

          <Input
            id="courseCode"
            name="courseCode"
            label="Číslo kurzu"
            value={item?.value?.courseCode}
            error={errors.courseCode}
            on:input={() => {
              delete errors.courseCode;
            }}
            disabled={submitting}
            required
          />
          <Input
            id="departureDate"
            name="departureDate"
            type="date"
            label="Datum odjezdu"
            value={formatDateInput(item?.value?.departureDate)}
            error={errors.departureDate}
            on:input={() => {
              delete errors.departureDate;
            }}
            disabled={submitting}
            required
          />

          <Select
            id="network"
            name="network"
            label="Síť"
            value={item?.value?.network}
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
            value={item?.value?.transporterEnumId}
            options={meta.value?.transporters.map((it) => ({ value: it.id, label: it.name }))}
            error={errors.transporterEnumId}
            on:change={() => {
              delete errors.transporterEnumId;
            }}
            disabled={submitting}
            required
          />

          <span class="col-span-2">
            <Textarea id="seals" name="seals" label="Plomby" value={item?.value?.seals} disabled={submitting} />
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
            value={item?.value?.departurePlannedTime}
            disabled={submitting}
          />
          <Input
            id="departureRealTime"
            name="departureRealTime"
            type="time"
            label="Skutečný odjezd"
            value={item?.value?.departureRealTime}
            disabled={submitting}
          />

          <span class="col-span-2">
            <Select
              id="departureDelayReasonEnumId"
              name="departureDelayReasonEnumId"
              label="Příčina zpoždění"
              value={item?.value?.departureDelayReasonEnumId}
              options={meta.value?.delayReasons.map((it) => ({ value: it.id, label: it.name }))}
              disabled={submitting}
            />
          </span>

          <span class="col-span-2">
            <Textarea
              id="departureNote"
              name="departureNote"
              label="Poznámka"
              value={item?.value?.departureNote}
              disabled={submitting}
            />
          </span>

          <span class="col-span-2">
            <Input
              id="departureLoad"
              name="departureLoad"
              label="Vytížení"
              value={item?.value?.departureLoad}
              error={errors.departureLoad}
              on:input={() => {
                delete errors.departureLoad;
              }}
              disabled={submitting}
              right
            >
              <FieldAffix slot="tail" dense>%</FieldAffix>
            </Input>
          </span>
        </FieldGrid>

        <Divider />

        <FieldGrid title="Přílohy" offset>
          <FileUpload oninput={(e) => addFiles("departure", e)} disabled={submitting} />

          <div class="flex flex-col gap-[8px]">
            {#each item?.value?.files.filter((it) => it.group === "departure") ?? [] as file (file.filename)}
              <a
                transition:fade={{ duration: 250 }}
                href="/api/courses/{item?.value?.id}/{file.filename}"
                target="_blank"
                class="file flex flex-row justify-start items-center gap-[12px] p-[12px]"
              >
                <Icon icon={faFile} />
                <Text>{file.displayName}</Text>
                <div class="ml-auto">
                  <Button
                    onclick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();

                      removeFile(file.filename);
                    }}
                    icon={faTrashAlt}
                    type="button"
                    variant="ghost"
                    small
                  />
                </div>
              </a>
            {/each}

            {#each departureFileList as file (file.name)}
              <div
                transition:fade={{ duration: 250 }}
                class="file flex flex-row justify-start items-center gap-[12px] p-[12px]"
              >
                <Icon icon={faFile} />
                <Text>{file.name}</Text>
                <div class="ml-auto">
                  <Icon icon={faSpinner} spin />
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
                value={item?.value?.loads.find(
                  (it) => it.group === "departure" && it.technologicalGroup === group.value,
                )?.amount}
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
                  value={item?.value?.loads.find(
                    (it) => it.group === "departure" && it.technologicalGroup === group.value,
                  )?.note}
                  disabled={submitting}
                />
              </div>

              {#each group.crates as crate (crate.crate)}
                <Input
                  id="departure-crate-amount-{group.value}:{crate.crate}"
                  name="departure-crate-amount-{group.value}:{crate.crate}"
                  inputmode="numeric"
                  error={errors[`departure-crate-amount-${group.value}:${crate.crate}`]}
                  value={item?.value?.crates.find(
                    (it) =>
                      it.group === "departure" && it.technologicalGroup === group.value && it.crate === crate.crate,
                  )?.amount}
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
          <Textarea
            id="departureOther"
            name="departureOther"
            label="Ostatní"
            value={item?.value?.departureOther}
            disabled={submitting}
          />
        </FieldGrid>
      </div>

      <div class="contents" class:hidden={tab !== "arrival"}>
        <FieldGrid cols={2} title="Příjezd kurzu" offset>
          <Input
            id="arrivalPlannedTime"
            name="arrivalPlannedTime"
            type="time"
            label="Plánovány příjezd"
            value={item?.value?.arrivalPlannedTime}
            disabled={submitting}
          />
          <Input
            id="arrivalRealTime"
            name="arrivalRealTime"
            type="time"
            label="Skutečný příjezd"
            value={item?.value?.arrivalRealTime}
            disabled={submitting}
          />

          <span class="col-span-2">
            <Select
              id="arrivalDelayReasonEnumId"
              name="arrivalDelayReasonEnumId"
              label="Příčina zpoždění"
              value={item?.value?.arrivalDelayReasonEnumId}
              options={meta.value?.delayReasons.map((it) => ({ value: it.id, label: it.name }))}
              disabled={submitting}
            />
          </span>

          <span class="col-span-2">
            <Textarea
              id="arrivalNote"
              name="arrivalNote"
              label="Poznámka"
              value={item?.value?.arrivalNote}
              disabled={submitting}
            />
          </span>

          <span class="col-span-2">
            <Input
              id="arrivalLoad"
              name="arrivalLoad"
              label="Vytížení"
              value={item?.value?.arrivalLoad}
              error={errors.arrivalLoad}
              on:input={() => {
                delete errors.arrivalLoad;
              }}
              disabled={submitting}
              right
            >
              <FieldAffix slot="tail" dense>%</FieldAffix>
            </Input>
          </span>
        </FieldGrid>

        <Divider />

        <FieldGrid title="Přílohy" offset>
          <FileUpload oninput={(e) => addFiles("arrival", e)} disabled={submitting} />

          <div class="flex flex-col gap-[8px]">
            {#each item?.value?.files.filter((it) => it.group === "arrival") ?? [] as file (file.filename)}
              <a
                transition:fade={{ duration: 250 }}
                href="/api/courses/{item?.value?.id}/{file.filename}"
                target="_blank"
                class="file flex flex-row justify-start items-center gap-[12px] p-[12px]"
              >
                <Icon icon={faFile} />
                <Text>{file.displayName}</Text>
                <div class="ml-auto">
                  <Button
                    onclick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();

                      removeFile(file.filename);
                    }}
                    icon={faTrashAlt}
                    type="button"
                    variant="ghost"
                    small
                  />
                </div>
              </a>
            {/each}

            {#each arrivalFileList as file (file.name)}
              <div
                transition:fade={{ duration: 250 }}
                class="file flex flex-row justify-start items-center gap-[12px] p-[12px]"
              >
                <Icon icon={faFile} />
                <Text>{file.name}</Text>
                <div class="ml-auto">
                  <Icon icon={faSpinner} spin />
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
                value={item?.value?.loads.find((it) => it.group === "arrival" && it.technologicalGroup === group.value)
                  ?.amount}
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
                  value={item?.value?.loads.find(
                    (it) => it.group === "arrival" && it.technologicalGroup === group.value,
                  )?.note}
                  disabled={submitting}
                />
              </div>

              {#each group.crates as crate (crate.crate)}
                <Input
                  id="arrival-crate-amount-{group.value}:{crate.crate}"
                  name="arrival-crate-amount-{group.value}:{crate.crate}"
                  inputmode="numeric"
                  value={item?.value?.crates.find(
                    (it) => it.group === "arrival" && it.technologicalGroup === group.value && it.crate === crate.crate,
                  )?.amount}
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
          <Textarea
            id="arrivalOther"
            name="arrivalOther"
            label="Ostatní"
            value={item?.value?.arrivalOther}
            disabled={submitting}
          />
        </FieldGrid>
      </div>
    </form>
  {:else if tab === "course"}
    <InfoGrid>
      <InfoGridValue label="DSPU">{item?.value?.locationName}</InfoGridValue>
      <InfoGridValue label="Číslo kurzu">{item?.value?.courseCode}</InfoGridValue>
      <InfoGridValue label="Odjezd">{formatDate(item?.value?.departureDate)}</InfoGridValue>
      <InfoGridValue label="Síť">{resource.transportNetwork(item?.value?.network!)}</InfoGridValue>
      <InfoGridValue label="Dopravce">{item?.value?.transporterName}</InfoGridValue>
    </InfoGrid>
  {:else if tab === "departure"}
    <InfoGrid title="Odjezd">
      <InfoGridValue label="Plánovány">{formatTime(item?.value?.departurePlannedTime)}</InfoGridValue>
      <InfoGridValue label="Skutečný">{formatTime(item?.value?.departureRealTime)}</InfoGridValue>
      <InfoGridValue label="Rozdíl">
        {#if item?.value?.departureDiff}
          <Badge color={item.value.departureDiff < 0 ? "blue" : "yellow"} small>
            {#if item.value.departureDiff > 0}+{/if}
            {item.value.departureDiff}
          </Badge>
        {/if}
      </InfoGridValue>
      <InfoGridValue label="Příčina zpoždění">{item?.value?.departureDelayName}</InfoGridValue>
      <InfoGridValue label="Poznámka">{item?.value?.departureNote}</InfoGridValue>
      <InfoGridValue label="Vytížení">
        {item?.value?.departureLoad}
        <Text element="span" color="secondary">%</Text>
      </InfoGridValue>
    </InfoGrid>

    <Divider />

    <FieldGrid title="Přílohy" offset>
      <div class="flex flex-col gap-[8px]">
        {#each item?.value?.files.filter((it) => it.group === "departure") ?? [] as file (file.filename)}
          <a
            transition:fade={{ duration: 250 }}
            href="/api/courses/{item?.value?.id}/{file.filename}"
            target="_blank"
            class="file flex flex-row justify-start items-center gap-[12px] p-[12px]"
          >
            <Icon icon={faFile} />
            <Text>{file.displayName}</Text>
          </a>
        {/each}
      </div>
    </FieldGrid>

    <Divider />

    {#each meta.value?.technologicalGroups ?? [] as group (group.value)}
      <InfoGrid title={resource.technologicalGroup(group.value)}>
        <InfoGridValue label="Počet">
          {item?.value?.loads.find((it) => it.group === "departure" && it.technologicalGroup === group.value)?.amount ??
            "-"}
          <Text element="span" color="secondary">{group.unit}</Text>
        </InfoGridValue>

        <InfoGridValue label="Poznámka">
          {item?.value?.loads.find((it) => it.group === "departure" && it.technologicalGroup === group.value)?.note ??
            "-"}
        </InfoGridValue>

        {#each group.crates as crate (crate.crate)}
          <InfoGridValue label={resource.crate(crate.crate)}>
            {item?.value?.crates.find(
              (it) => it.group === "departure" && it.technologicalGroup === group.value && it.crate === crate.crate,
            )?.amount ?? "-"}
          </InfoGridValue>
        {/each}
      </InfoGrid>

      <Divider />
    {/each}

    <InfoGrid title="Ostatní">
      <InfoGridValue label="Ostatní">{item?.value?.departureOther}</InfoGridValue>
    </InfoGrid>
  {:else if tab === "arrival"}
    <InfoGrid title="Příjezd">
      <InfoGridValue label="Plánovány">{formatTime(item?.value?.arrivalPlannedTime)}</InfoGridValue>
      <InfoGridValue label="Skutečný">{formatTime(item?.value?.arrivalRealTime)}</InfoGridValue>
      <InfoGridValue label="Rozdíl">
        {#if item?.value?.arrivalDiff}
          <Badge color={item.value.arrivalDiff < 0 ? "blue" : "yellow"} small>
            {#if item.value.arrivalDiff > 0}+{/if}
            {item.value.arrivalDiff}
          </Badge>
        {/if}
      </InfoGridValue>
      <InfoGridValue label="Příčina zpoždění">{item?.value?.arrivalDelayName}</InfoGridValue>
      <InfoGridValue label="Poznámka">{item?.value?.arrivalNote}</InfoGridValue>
      <InfoGridValue label="Vytížení">
        {item?.value?.arrivalLoad}
        <Text element="span" color="secondary">%</Text>
      </InfoGridValue>
    </InfoGrid>

    <Divider />

    <FieldGrid title="Přílohy" offset>
      <div class="flex flex-col gap-[8px]">
        {#each item?.value?.files.filter((it) => it.group === "arrival") ?? [] as file (file.filename)}
          <a
            transition:fade={{ duration: 250 }}
            href="/api/courses/{item?.value?.id}/{file.filename}"
            target="_blank"
            class="file flex flex-row justify-start items-center gap-[12px] p-[12px]"
          >
            <Icon icon={faFile} />
            <Text>{file.displayName}</Text>
            <div class="ml-auto">
              <Button
                onclick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();

                  removeFile(file.filename);
                }}
                icon={faTrashAlt}
                type="button"
                variant="ghost"
                small
              />
            </div>
          </a>
        {/each}
      </div>
    </FieldGrid>

    <Divider />

    {#each meta.value?.technologicalGroups ?? [] as group (group.value)}
      <InfoGrid title={resource.technologicalGroup(group.value)}>
        <InfoGridValue label="Počet">
          {item?.value?.loads.find((it) => it.group === "arrival" && it.technologicalGroup === group.value)?.amount ??
            "-"}
          <Text element="span" color="secondary">{group.unit}</Text>
        </InfoGridValue>

        <InfoGridValue label="Poznámka">
          {item?.value?.loads.find((it) => it.group === "arrival" && it.technologicalGroup === group.value)?.note ??
            "-"}
        </InfoGridValue>

        {#each group.crates as crate (crate.crate)}
          <InfoGridValue label={resource.crate(crate.crate)}>
            {item?.value?.crates.find(
              (it) => it.group === "arrival" && it.technologicalGroup === group.value && it.crate === crate.crate,
            )?.amount ?? "-"}
          </InfoGridValue>
        {/each}
      </InfoGrid>

      <Divider />
    {/each}

    <InfoGrid title="Ostatní">
      <InfoGridValue label="Ostatní">{item?.value?.arrivalOther}</InfoGridValue>
    </InfoGrid>
  {/if}
</Sheet>

<style lang="scss">
  .file {
    background-color: var(--background-light);

    border-radius: var(--small);

    transition-property: background-color;

    &:hover {
      background-color: var(--background-medium);
    }
  }
</style>
