<script lang="ts">
  import type { Snippet } from "svelte";

  interface TableRowActionsProps {
    children?: Snippet;
  }

  let { children }: TableRowActionsProps = $props();
</script>

<div class="flex flex-row justify-end items-center gap-[8px]">
  {@render children?.()}
</div>
