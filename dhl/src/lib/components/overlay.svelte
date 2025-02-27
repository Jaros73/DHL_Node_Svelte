<script lang="ts">
  import { portal } from "$lib/actions/portal";
  import type { Snippet } from "svelte";
  import { fade } from "svelte/transition";

  interface OverlayProps {
    children?: Snippet;
  }

  let { children }: OverlayProps = $props();
</script>

<div use:portal transition:fade={{ duration: 150 }} class="overlay">
  {@render children?.()}
</div>

<style lang="scss">
  .overlay {
    position: fixed;
    inset: 0;
    z-index: var(--layer-modal);

    display: flex;
    justify-content: center;
    align-items: center;

    background-color: rgba(44, 44, 44, 0.5);
  }
</style>
