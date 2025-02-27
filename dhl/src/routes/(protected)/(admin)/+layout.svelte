<script lang="ts">
  import { authClient } from "$lib/auth/auth-client.svelte";

  let { children } = $props();
</script>

{#if authClient.identity.isAdmin}
  {@render children()}
{/if}
