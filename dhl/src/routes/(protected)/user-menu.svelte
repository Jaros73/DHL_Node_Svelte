<script lang="ts">
  import { authClient } from "$lib/auth/auth-client.svelte";
  import Avatar from "$lib/components/avatar.svelte";
  import Divider from "$lib/components/divider.svelte";
  import Icon from "$lib/components/icon.svelte";
  import Text from "$lib/components/text.svelte";
  import { stack } from "$lib/stack.svelte";
  import { faMoon, faRightFromBracket, faSun } from "@fortawesome/free-solid-svg-icons";
  import { createPopover } from "@melt-ui/svelte";
  import { fade } from "svelte/transition";
  import { theme } from "./theme.svelte";
  import UserLocations from "./user-locations.svelte";

  let {
    elements: { content, trigger },
    states: { open },
  } = createPopover({
    positioning: {
      placement: "right",
    },
  });

  let canRequestLocation = $derived(!authClient.identity.isAdmin);

  function toggleTheme() {
    theme.toggle();
    $open = false;
  }
</script>

<button {...$trigger} use:trigger type="button">
  <Avatar>{authClient.identity.initials}</Avatar>
</button>

{#if $open}
  <div {...$content} use:content transition:fade={{ duration: 150 }} class="popover">
    <div class="flex flex-row items-center p-[8px] pb-[0px] gap-[12px]">
      <Avatar>{authClient.identity.initials}</Avatar>
      <div>
        <Text font="body-bold-small">{authClient.identity.fullName}</Text>
        <Text font="caption-regular" color="secondary">{authClient.identity.id}</Text>
      </div>
    </div>

    <Divider />

    {#if canRequestLocation}
      <button
        onclick={() => {
          $open = false;
          stack.openLocations();
        }}
      >
        Provozovny
      </button>
    {/if}

    <button onclick={toggleTheme}>
      <Icon icon={theme.current === "dark" ? faSun : faMoon} />
      {theme.current === "dark" ? "Světlý" : "Tmavý"} motív
    </button>

    <a href="/logout">
      <Icon icon={faRightFromBracket} />
      Odhlásit
    </a>
  </div>
{/if}

{#if stack.isLocations}
  <UserLocations />
{/if}

<style lang="scss">
  button {
    background-color: transparent;

    border: none;
    outline: 2px solid transparent;
    outline-offset: 2px;
    border-radius: 100%;

    transition-property: outline-color;

    &:focus-visible {
      outline-color: var(--accent-light);
    }
  }

  .popover {
    z-index: 10;

    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: stretch;
    gap: 10px;

    padding: 0 0 10px 0;

    width: 240px;

    background-color: var(--background-surface);

    border: 1px solid var(--border-light);
    border-radius: var(--large);

    a,
    button {
      display: flex;
      flex-direction: row;
      justify-content: flex-start;
      align-items: center;
      gap: 12px;

      margin: 0 10px;
      padding: 8px;

      font: var(--body-bold-small);
      color: var(--text-secondary);
      text-decoration: none;

      background-color: transparent;

      border: none;
      outline: 2px solid transparent;
      border-radius: var(--tiny);

      cursor: pointer;

      transition-property: color, background-color, outline;

      &:hover {
        color: var(--text-primary);

        background-color: var(--action-light);
      }

      &:focus-visible {
        color: var(--text-primary);

        outline: 2px solid var(--accent-primary);
      }
    }
  }
</style>
