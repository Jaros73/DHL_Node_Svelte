<script lang="ts">
  import type { Snippet } from "svelte";

  interface ChipGridProps {
    children?: Snippet;
  }

  let { children }: ChipGridProps = $props();
</script>

<div class="chip-grid">
  {@render children?.()}
</div>

<style lang="scss">
  .chip-grid {
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: flex-start;
    flex-wrap: wrap;
    gap: 12px;
  }
</style>
