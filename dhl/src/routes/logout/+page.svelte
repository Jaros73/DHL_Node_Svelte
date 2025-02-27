<script lang="ts">
  import { authClient } from "$lib/auth/auth-client.svelte";
  import Splash from "$lib/components/splash.svelte";
  import { onMount } from "svelte";

  onMount(async () => {
    await authClient.logout();
  });
</script>

<Splash
  title="Byli jste odhlášeni"
  subtitle="Chcete-li pokračovat, přihlaste se znovu."
  action={{ href: "/login", label: "Přihlásit" }}
/>
