<script lang="ts">
  import { authClient } from "$lib/auth/auth-client.svelte";
  import { Role } from "$lib/auth/roles";

  let { children } = $props();
</script>

{#if authClient.identity.hasRole(Role.Dispecink)}
  {@render children()}
{/if}
