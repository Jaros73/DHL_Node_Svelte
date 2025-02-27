<script lang="ts">
  import { authClient } from "$lib/auth/auth-client.svelte";
  import { Role } from "$lib/auth/roles";
  import Badge from "$lib/components/badge.svelte";
  import Button from "$lib/components/button.svelte";
  import Dialog from "$lib/components/dialog.svelte";
  import Divider from "$lib/components/divider.svelte";
  import Icon from "$lib/components/icon.svelte";
  import SearchInput from "$lib/components/search-input.svelte";
  import Text from "$lib/components/text.svelte";
  import { formatDate } from "$lib/format";
  import { resource } from "$lib/resource";
  import { stack } from "$lib/stack.svelte";
  import { toast } from "$lib/toast.svelte";
  import { unaccent } from "$lib/unaccent";
  import { faCheck, faPlus } from "@fortawesome/free-solid-svg-icons";
  import { untrack } from "svelte";
  import { locationsClient } from "./locations-client.svelte";

  locationsClient.find({
    filter: undefined,
    search: undefined,
  });

  let scrollArea: HTMLDivElement;

  let roles = $derived(authClient.identity.roles.filter((it) => !it.endsWith("_admin")));
  let selected = $state("");
  $effect(() => {
    if (roles.length > 0) {
      selected = roles[0];
    }
  });

  let search = $state("");

  $effect(() => {
    selected;
    untrack(() => {
      search = "";
      scrollArea.scrollTo({ top: 0, left: 0, behavior: "instant" });
    });
  });

  let locations = $derived(
    locationsClient.items.filter(
      (it) =>
        (selected !== Role.Dispecink || it.postOfficeType === "SPU") &&
        (search === "" || unaccent(it.name).includes(unaccent(search))),
    ),
  );

  let requests = $derived(locationsClient.getLocationRequests());
  let liveLocations = $derived(locationsClient.getLiveLocations());

  async function revokeRequest(role: string, locationId: string) {
    try {
      await locationsClient.revokeRequest(role, locationId);
      if (requests.items) {
        let ix = requests.items.findIndex((it) => it.role === role && it.locationId === locationId);
        if (ix > -1) {
          requests.items.splice(ix, 1);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Zrušení žádosti selhalo.");
    }
  }

  async function requestAccess(role: string, locationId: string) {
    try {
      let request = await locationsClient.requestLocation(role, locationId);
      if (requests.items) {
        requests.items.push(request);
      }
    } catch (err) {
      console.error(err);
      toast.error("Žádost selhala.");
    }
  }
</script>

<Dialog onclose={() => stack.closeLocations()} title="Přístup k provozovnám" width={960} height="70dvh">
  <section class="grid grid-cols-[220px_auto]">
    <nav>
      <p>Přiřazené role</p>
      {#each roles as role (role)}
        <button
          onclick={() => {
            selected = role;
          }}
          type="button"
          class:active={selected === role}
        >
          {resource.role(role)}
        </button>
      {/each}
    </nav>
    <div class="flex flex-col justify-start items-stretch overflow-hidden">
      <div>
        <div class="m-[12px]">
          <SearchInput bind:value={search} />
        </div>
        <Divider />
      </div>

      <div bind:this={scrollArea} class="flex flex-col justify-start items-stretch overflow-auto px-[20px] py-[16px]">
        {#each locations as location, i}
          {#if i !== 0}
            <Divider />
          {/if}
          <div class="flex flex-row justify-between items-center py-[10px]">
            {location.name}

            <div class="flex flex-row items-center gap-[8px]">
              {#if liveLocations.items.some((it) => it.role === selected && it.locationId === location.id)}
                <Text font="body-bold-small">
                  <span class="allowed-text">Povoleno</span>
                </Text>
                <span class="allowed-text">
                  <Icon icon={faCheck} />
                </span>
                {#if !authClient.identity.hasLocation(selected as Role, location.id)}
                  <Badge small>Vyžadováno nové přihlášení</Badge>
                {/if}
              {:else if requests.items.some((it) => it.role === selected && it.locationId === location.id)}
                <Text font="body-medium-small" color="hint">
                  Zažádano {formatDate(
                    requests.items.find((it) => it.role === selected && it.locationId === location.id)?.timeRequested,
                  )}
                </Text>
                <Button
                  onclick={() => {
                    revokeRequest(selected, location.id);
                  }}
                  variant="transparent"
                  small>Zrušit žádost</Button
                >
              {:else}
                <Button
                  onclick={() => {
                    requestAccess(selected, location.id);
                  }}
                  icon={faPlus}
                  variant="transparent"
                  small>Zažádat o přístup</Button
                >
              {/if}
            </div>
          </div>
        {/each}
      </div>
    </div>
  </section>
</Dialog>

<style lang="scss">
  section {
    flex: 1 0 auto;

    nav {
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      align-items: stretch;
      gap: 4px;

      padding: 8px;

      border-right: 1px solid var(--border-light);

      p {
        margin: 0;
        padding: 12px;

        font: var(--overline);
        color: var(--text-secondary);
        text-transform: uppercase;
      }

      button {
        display: flex;
        flex-direction: row;
        justify-content: flex-start;
        align-items: center;
        gap: 12px;

        padding: 8px;

        font: var(--body-bold-small);
        color: var(--text-secondary);
        text-align: left;
        text-decoration: none;
        white-space: nowrap;

        background-color: transparent;

        border: none;
        outline: 2px solid transparent;
        border-radius: var(--tiny);

        cursor: pointer;

        transition-property: color, background-color, outline;
        transition-duration: 0.1s;

        &:hover {
          color: var(--text-primary);

          background-color: var(--action-light);
        }

        &:focus-visible {
          color: var(--text-primary);

          outline: 2px solid var(--accent-primary);
        }

        &.active {
          color: var(--accent-primary);

          background-color: var(--accent-background);
        }
      }
    }

    span.allowed-text {
      color: var(--success-primary);
    }
  }
</style>
