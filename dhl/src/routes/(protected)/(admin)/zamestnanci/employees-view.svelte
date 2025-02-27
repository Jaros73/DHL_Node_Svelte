<script lang="ts">
  import { authClient } from "$lib/auth/auth-client.svelte";
  import { Role } from "$lib/auth/roles";
  import Avatar from "$lib/components/avatar.svelte";
  import Badge from "$lib/components/badge.svelte";
  import Button from "$lib/components/button.svelte";
  import Collapsible from "$lib/components/collapsible.svelte";
  import Divider from "$lib/components/divider.svelte";
  import InfoGridValue from "$lib/components/info-grid-value.svelte";
  import InfoGrid from "$lib/components/info-grid.svelte";
  import SearchInput from "$lib/components/search-input.svelte";
  import Sheet from "$lib/components/sheet.svelte";
  import Switch from "$lib/components/switch.svelte";
  import TextButton from "$lib/components/text-button.svelte";
  import Text from "$lib/components/text.svelte";
  import { resource } from "$lib/resource";
  import { stack } from "$lib/stack.svelte";
  import { toast } from "$lib/toast.svelte";
  import { unaccent } from "$lib/unaccent";
  import { untrack } from "svelte";
  import { employeesClient } from "./employees-client";

  let meta = employeesClient.meta();
  let item = $derived(stack.view ? untrack(() => employeesClient.get(String(stack.view))) : null);
  let groups = $derived(authClient.identity.adminOf.filter((it) => item?.value?.roles.includes(it)));
  let isSingleGroup = $derived(groups.length === 1);

  let search = $state("");
  let filteredLocations = $derived(
    meta.value?.locations.filter((it) => search === "" || unaccent(it.name) === unaccent(search)) ?? [],
  );

  async function setLocation(enabled: boolean, role: string, locations: string[]) {
    if (!item?.value) {
      return;
    }

    try {
      await employeesClient?.update(item.value.id, {
        add: enabled ? locations.map((it) => ({ id: it, role })) : undefined,
        remove: !enabled ? locations.map((it) => ({ id: it, role })) : undefined,
      });

      for (let location of locations) {
        if (enabled) {
          item.value.locations.push({ locationId: location, role, userId: item.value.id });
        } else {
          item.value.locations = item.value.locations.filter(
            (it) => `${it.locationId}-${role}` !== `${location}-${role}`,
          );
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Aktualizace selhala.");
    }
  }
</script>

<Sheet title="Provozovny zaměstnance" onclose={() => stack.closeView()}>
  <InfoGrid title="Všeobecné údaje">
    <InfoGridValue label="Osobní číslo">{item?.value?.id}</InfoGridValue>
    <InfoGridValue label="Jméno">
      <div class="flex flex-row items-center gap-[8px]">
        <Avatar small>{item?.value?.fullName[0]}</Avatar>
        {item?.value?.fullName}
      </div>
    </InfoGridValue>
    <InfoGridValue label="Role">
      <div class="flex flex-row flex-wrap items-center gap-[10px]">
        {#each item?.value?.roles ?? [] as role (role)}
          <Badge small>{resource.role(role)}</Badge>
        {/each}
      </div>
    </InfoGridValue>
  </InfoGrid>

  <Divider />

  <div class="flex flex-col items-stretch p-[12px]">
    <SearchInput bind:value={search} />
  </div>

  <Divider />

  {#if groups.includes(Role.Dispecink)}
    <Collapsible title={resource.role(Role.Dispecink)} passive={isSingleGroup || search !== ""}>
      <div class="p-[12px]">
        <div class="flex flex-row justify-between items-center p-[12px]">
          <Text font="body-bold-small">Provozovna</Text>
          {#if search === ""}
            <div class="flex flex-row items-center gap-[12px]">
              <TextButton
                onclick={() => {
                  setLocation(
                    false,
                    Role.Dispecink,
                    filteredLocations.filter((it) => it.postOfficeType === "SPU").map((it) => it.id),
                  );
                }}
                variant="secondary"
              >
                Odebrat všechny
              </TextButton>
              <TextButton
                onclick={() => {
                  setLocation(
                    true,
                    Role.Dispecink,
                    filteredLocations.filter((it) => it.postOfficeType === "SPU").map((it) => it.id),
                  );
                }}
                variant="secondary"
              >
                Povolit všechny
              </TextButton>
            </div>
          {/if}
        </div>
        <Divider />

        {#each filteredLocations.filter((it) => it.postOfficeType === "SPU") as location, i (`${location.id}-${Role.Dispecink}`)}
          {@const enabled = item?.value?.locations?.some(
            (it) => it.role === Role.Dispecink && it.locationId === location.id,
          )}

          {#if i !== 0}
            <Divider />
          {/if}

          <label for="loc-{Role.Dispecink}-{location.id}">
            <Text font="body-bold-small">{location.name}</Text>
            <Text font="body-medium-small" color="secondary">
              &nbsp;&bull; {location.zip}
            </Text>
            <div class="flex flex-row items center gap-[12px] ml-auto">
              <Text font="body-bold-small" color={enabled ? "primary" : "secondary"}>
                {enabled ? "Povoleno" : "Nepovoleno"}
              </Text>
              <Switch
                on:change={e => {
                  let checked = (e.target as HTMLInputElement).checked;
                  setLocation(checked, Role.Dispecink, [location.id]);
                }}
                id="loc-{Role.Dispecink}-{location.id}"
                checked={enabled}
              />
            </div>
          </label>
        {/each}
      </div>
    </Collapsible>
    <Divider />
  {/if}

  {#each [Role.RegLogistika, Role.OhlaskyZavad] as role (role)}
    {#if groups.includes(role)}
      <Collapsible title={resource.role(role)} passive={isSingleGroup || search !== ""}>
        <div class="flex flex-col align-stretch gap-[20px] p-[20px]">
          {#each ["SPU", "DEPO"] as postOfficeType (postOfficeType)}
            <Collapsible secondary title={postOfficeType === "SPU" ? "DSPU" : postOfficeType} passive={search !== ""}>
              <div class="p-[12px]">
                <div class="flex flex-row justify-between items-center p-[12px]">
                  <Text font="body-bold-small">Provozovna</Text>
                  {#if search === ""}
                    <div class="flex flex-row items-center gap-[12px]">
                      <TextButton
                        onclick={() => {
                          setLocation(
                            false,
                            role,
                            filteredLocations.filter((it) => it.postOfficeType === postOfficeType).map((it) => it.id),
                          );
                        }}
                        variant="secondary"
                      >
                        Odebrat všechny
                      </TextButton>
                      <TextButton
                        onclick={() => {
                          setLocation(
                            true,
                            role,
                            filteredLocations.filter((it) => it.postOfficeType === postOfficeType).map((it) => it.id),
                          );
                        }}
                        variant="secondary"
                      >
                        Povolit všechny
                      </TextButton>
                    </div>
                  {/if}
                </div>
                <Divider />

                {#each filteredLocations.filter((it) => it.postOfficeType === postOfficeType) as location, i (`${location.id}-${role}`)}
                  {@const enabled = item?.value?.locations?.some(
                    (it) => it.role === role && it.locationId === location.id,
                  )}

                  {#if i !== 0}
                    <Divider />
                  {/if}

                  <label for="loc-{role}-{location.id}-{postOfficeType}">
                    <Text font="body-bold-small">{location.name}</Text>
                    <Text font="body-medium-small" color="secondary">
                      &nbsp;&bull; {location.zip}
                    </Text>
                    <div class="flex flex-row items center gap-[12px] ml-auto">
                      <Text font="body-bold-small" color={enabled ? "primary" : "secondary"}>
                        {enabled ? "Povoleno" : "Nepovoleno"}
                      </Text>
                      <Switch
                        on:change={e => {
                          let checked = (e.target as HTMLInputElement).checked;
                          setLocation(checked, role, [location.id]);
                        }}
                        id="loc-{role}-{location.id}-{postOfficeType}"
                        checked={enabled}
                      />
                    </div>
                  </label>
                {/each}
              </div>
            </Collapsible>
          {/each}

          {#each new Set(filteredLocations.map((it) => it.regionOrg)) as regionOrg (regionOrg)}
            <Collapsible secondary title={regionOrg} passive={search !== ""}>
              <div class="p-[12px]">
                <div class="flex flex-row justify-between items-center p-[12px]">
                  <Text font="body-bold-small">Provozovna</Text>
                  {#if search === ""}
                    <div class="flex flex-row items-center gap-[12px]">
                      <TextButton
                        onclick={() => {
                          setLocation(
                            false,
                            role,
                            filteredLocations.filter((it) => it.regionOrg === regionOrg).map((it) => it.id),
                          );
                        }}
                        variant="secondary"
                      >
                        Odebrat všechny
                      </TextButton>
                      <TextButton
                        onclick={() => {
                          setLocation(
                            true,
                            role,
                            filteredLocations.filter((it) => it.regionOrg === regionOrg).map((it) => it.id),
                          );
                        }}
                        variant="secondary"
                      >
                        Povolit všechny
                      </TextButton>
                    </div>
                  {/if}
                </div>
                <Divider />

                {#each filteredLocations.filter((it) => it.regionOrg === regionOrg) as location, i}
                  {@const enabled = item?.value?.locations?.some(
                    (it) => it.role === role && it.locationId === location.id,
                  )}

                  {#if i !== 0}
                    <Divider />
                  {/if}

                  <label for="loc-{role}-{location.id}-{regionOrg}">
                    <Text font="body-bold-small">{location.name}</Text>
                    <Text font="body-medium-small" color="secondary">
                      &nbsp;&bull; {location.zip}
                    </Text>
                    <div class="flex flex-row items center gap-[12px] ml-auto">
                      <Text font="body-bold-small" color={enabled ? "primary" : "secondary"}>
                        {enabled ? "Povoleno" : "Nepovoleno"}
                      </Text>
                      <Switch
                        on:change={e => {
                          let checked = (e.target as HTMLInputElement).checked;
                          setLocation(checked, role, [location.id])
                        }}
                        id="loc-{role}-{location.id}-{regionOrg}"
                        checked={enabled}
                      />
                    </div>
                  </label>
                {/each}
              </div>
            </Collapsible>
          {/each}
        </div>
      </Collapsible>
      <Divider />
    {/if}
  {/each}

  {#snippet footer()}
    <Text font="body-regular-small" color="secondary">Změny provozoven se ukládají automaticky.</Text>
    <Button onclick={() => stack.closeView()} variant="outlined">Zavřít</Button>
  {/snippet}
</Sheet>

<style lang="scss">
  label {
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;

    margin: 6px 0;
    padding: 12px;

    border-radius: var(--medium);

    cursor: pointer;

    transition-property: background-color;

    &:hover {
      background-color: var(--background-light);
    }
  }
</style>
