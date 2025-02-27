<script lang="ts">
  import type { Snippet } from "svelte";
  import Text from "./text.svelte";

  interface FieldGridProps {
    title?: string;
    cols?: number;
    offset?: boolean;
    children?: Snippet;
  }

  let { title, cols = 1, offset, children }: FieldGridProps = $props();

  let colsStyle = $derived("1fr ".repeat(cols).trim());
</script>

<section class:offset style="--fields-grid-cols: {colsStyle}">
  {#if title}
    <div class="title">
      <Text font="subheadline-bold-large">{title}</Text>
    </div>
  {/if}

  {@render children?.()}
</section>

<style lang="scss">
  .title {
    grid-column: 1 / -1;
  }

  section {
    display: grid;
    grid-template-columns: var(--fields-grid-cols);
    gap: 24px 16px;

    &.offset {
      padding: 24px 20px;
    }
  }
</style>
