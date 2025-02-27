<script lang="ts">
  import type { Snippet } from "svelte";
  import Text from "./text.svelte";

  interface InfoGridValueProps {
    label: string;
    children?: Snippet;
  }

  let { label, children }: InfoGridValueProps = $props();
</script>

<Text font="body-bold-small" color="secondary">{label}</Text>
<Text font="body-bold-small">
  {@render children?.()}
</Text>
