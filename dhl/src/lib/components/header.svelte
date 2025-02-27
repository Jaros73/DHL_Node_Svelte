<script lang="ts">
  import type { Snippet } from "svelte";
  import Text from "./text.svelte";

  interface HeaderProps {
    title: string;
    children?: Snippet;
  }

  let { title, children }: HeaderProps = $props();
</script>

<header class="flex flex-row justify-between items-center px-[20px] pt-[16px] pb-[15px]">
  <Text element="h1" font="h6" color="primary">{title}</Text>

  <aside class="flex flex-row justify-end items-center flex-wrap gap-[12px]">
    {@render children?.()}
  </aside>
</header>
