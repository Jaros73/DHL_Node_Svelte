<script lang="ts">
  import type { Snippet } from "svelte";

  interface FieldProps {
    children?: Snippet;
  }

  let { children }: FieldProps = $props();
</script>

<div class="field">
  {@render children?.()}
</div>

<style lang="scss">
  .field {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: stretch;
    gap: 12px;
  }
</style>
