<script lang="ts">
  import type { Snippet } from "svelte";
  import Text from "./text.svelte";

  interface InfoGridProps {
    title?: string;
    children?: Snippet;
  }

  let { title, children }: InfoGridProps = $props();
</script>

<div class="grid grid-cols-[96px_auto] gap-x-[48px] gap-y-[24px] px-[20px] py-[24px]">
  {#if title}
    <div class="col-span-2">
      <Text font="subheadline-bold">{title}</Text>
    </div>
  {/if}

  {@render children?.()}
</div>
