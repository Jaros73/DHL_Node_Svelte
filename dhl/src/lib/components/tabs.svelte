<script lang="ts">
  import type { Snippet } from "svelte";

  interface TabsProps {
    offset?: boolean;
    children?: Snippet;
  }

  let { offset, children }: TabsProps = $props();
</script>

<div class="flex flex-row justify-start items-end" class:offset>
  {@render children?.()}
</div>

<style lang="scss">
  .offset {
    margin: 0 20px;
  }
</style>
