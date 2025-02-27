<script lang="ts">
  import type { Snippet } from "svelte";

  interface TextProps {
    element?: string;
    font?: string;
    color?: "primary" | "secondary" | "hint";
    children?: Snippet;
  }

  let { element = "p", font = "body-regular", color = "primary", children }: TextProps = $props();
</script>

<svelte:element this={element} style:font="var(--{font})" style:color="var(--text-{color})">
  {@render children?.()}
</svelte:element>
