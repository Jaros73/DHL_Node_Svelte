<script lang="ts">
  import { faClose } from "@fortawesome/free-solid-svg-icons";
  import type { Snippet } from "svelte";
  import { fly } from "svelte/transition";
  import { portal } from "../actions/portal";
  import Button from "./button.svelte";
  import Text from "./text.svelte";

  interface SheetProps {
    title: string;
    children?: Snippet;
    actions?: Snippet;
    sticky?: Snippet;
    footer?: Snippet;

    onclose?(): void;
  }

  let { title, children, actions, sticky, footer, onclose }: SheetProps = $props();

  function close() {
    onclose?.();
  }

  let section = $state<HTMLElement>();
  export function scrollToTop() {
    section?.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant",
    });
  }
</script>

<div use:portal transition:fly={{ x: "1rem", opacity: 0, duration: 150 }} class="sheet">
  <header>
    <Text element="h2" font="subheadline-bold-large">{title}</Text>
    <div class="actions">
      {@render actions?.()}
    </div>
    <div class="ml-[12px]">
      <Button onclick={() => close()} icon={faClose} variant="transparent" />
    </div>
  </header>

  <div class="sticky">
    {@render sticky?.()}
  </div>

  <section bind:this={section}>
    {@render children?.()}
  </section>

  <footer>
    {#if footer}
      {@render footer()}
    {:else}
      <Button onclick={() => close()} variant="outlined">Zavřít</Button>
    {/if}
  </footer>
</div>

<style lang="scss">
  .sheet {
    position: fixed;
    z-index: var(--layer-sheet);
    top: 0;
    right: 0;
    bottom: 0;

    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: stretch;

    width: 640px;

    background-color: var(--background-surface);

    border-left: 1px solid var(--border-light);

    overflow: auto;

    header {
      z-index: 1;

      display: flex;
      flex-direction: row;
      justify-content: flex-start;
      align-items: center;

      padding: 16px 20px 15px 20px;

      background-color: var(--background-surface);

      border-bottom: 1px solid var(--border-light);

      .actions {
        display: flex;
        flex-direction: row;
        justify-content: flex-end;
        align-items: center;
        gap: 8px;

        margin-left: auto;
      }
    }

    section {
      flex: 1 1 0;

      overflow: auto;
    }

    footer {
      display: flex;
      flex-direction: row;
      justify-content: flex-end;
      align-items: center;
      gap: 12px;

      margin-top: auto;
      padding: 16px 20px;

      background-color: var(--background-light);

      border-top: 1px solid var(--border-light);
    }
  }
</style>
