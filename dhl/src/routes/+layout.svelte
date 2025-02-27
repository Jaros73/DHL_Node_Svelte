<script lang="ts">
  import { title } from "$lib/title";
  import "../app.scss";

  let { children } = $props();
</script>

<svelte:head>
  <title>{title()}</title>
</svelte:head>

{@render children()}
