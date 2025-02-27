<script lang="ts">
  import type { Snippet } from "svelte";

  interface FieldErrorProps {
    children: Snippet;
  }

  let { children }: FieldErrorProps = $props();
</script>

<p>
  {@render children?.()}
</p>

<style lang="scss">
  p {
    margin: 0;

    font: var(--caption-regular);
    color: var(--error-primary);
  }
</style>
