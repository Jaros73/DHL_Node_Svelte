<script lang="ts">
  import { faClose } from "@fortawesome/free-solid-svg-icons";
  import type { Snippet } from "svelte";
  import { fade, fly } from "svelte/transition";
  import Button from "./button.svelte";
  import Overlay from "./overlay.svelte";
  import Text from "./text.svelte";

  interface DialogProps {
    title: string;
    width?: 440 | 640 | 800 | 960 | 1200;
    height?: string;
    offset?: boolean;
    children?: Snippet;
    footer?: Snippet;

    onclose?(): void;
  }

  let { title, width = 640, height, offset, children, footer, onclose }: DialogProps = $props();
</script>

<Overlay>
  <div
    in:fly={{ y: "1rem", opacity: 0, duration: 150 }}
    out:fade={{ duration: 150 }}
    style:width="{width}px"
    style:height
    class="dialog"
  >
    <div class="header">
      <Text font="subheadline-bold-large">{title}</Text>
      <Button onclick={() => onclose?.()} icon={faClose} variant="transparent" />
    </div>

    <div class="content" class:offset>
      {@render children?.()}
    </div>

    <div class="footer">
      {#if footer}
        {@render footer()}
      {:else}
        <Button onclick={() => onclose?.()} variant="outlined">Zavřít</Button>
      {/if}
    </div>
  </div>
</Overlay>

<style lang="scss">
  .dialog {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: stretch;

    background-color: var(--background-surface);

    border: 1px solid var(--border-light);
    border-radius: var(--large);

    overflow: hidden;

    .header {
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      align-items: center;

      flex: 1 0 auto;

      padding: 16px 20px;

      border-bottom: 1px solid var(--border-light);
    }

    .content {
      flex: 0 1 auto;

      overflow: hidden;

      &.offset {
        padding: 16px 20px;
      }
    }

    .footer {
      display: flex;
      flex-direction: row;
      justify-content: flex-end;
      align-items: center;
      gap: 12px;

      flex: 1 0 auto;

      padding: 16px 20px;

      background-color: var(--background-light);

      border-top: 1px solid var(--border-light);
    }
  }
</style>
