<script lang="ts">
  import { page } from "$app/stores";
  import Text from "$lib/components/text.svelte";
  import { resource } from "$lib/resource";
  import { title } from "$lib/title";
  import { enumsClient } from "./enums-client.svelte";

  let { children } = $props();

  enumsClient.find();
</script>

<svelte:head>
  <title>{title("Číselníky")}</title>
</svelte:head>

<div class="screen grid grid-cols-[260px_auto]">
  <nav>
    <div class="title p-[12px]">
      <Text font="caption-bold" color="secondary">Číselníky</Text>
    </div>

    {#each enumsClient.items as item (item)}
      <a href="/ciselniky/{item}" class:active={item === $page.params.key}>
        {resource.enum(item)}
      </a>
    {/each}
  </nav>
  <section>
    {@render children()}
  </section>
</div>

<style lang="scss">
  .screen {
    height: 100vh;
    height: 100dvh;

    nav {
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      align-items: stretch;
      gap: 8px;

      padding: 12px;

      border-right: 1px solid var(--border-light);

      overflow: auto;

      .title {
        text-transform: uppercase;
      }

      a {
        padding: 9px 12px;

        font: var(--body-bold-small);
        color: var(--text-secondary);
        text-decoration: none;

        background-color: transparent;

        border: none;
        outline: 2px solid transparent;
        border-radius: var(--tiny);

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
          color: var(--text-primary);

          background-color: var(--action-light);
        }
      }
    }

    section {
      overflow: auto;
    }
  }
</style>
