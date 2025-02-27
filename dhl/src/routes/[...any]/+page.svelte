<script lang="ts">
  import { page } from "$app/stores";
  import Splash from "$lib/components/splash.svelte";
  import { title } from "$lib/title";
</script>

<svelte:head>
  <title>{title("Stránka nenalezena")}</title>
</svelte:head>

<Splash
  title="Stránka nenalezena"
  subtitle="404 {$page.url.pathname}"
  action={{
    href: "/",
    label: "Domů",
  }}
/>
