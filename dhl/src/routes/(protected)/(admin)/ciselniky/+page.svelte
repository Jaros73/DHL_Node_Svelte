<script lang="ts">
  import { goto } from "$app/navigation";
  import { enumsClient } from "./enums-client.svelte";

  $effect(() => {
    let first = enumsClient.items[0];
    if (first) {
      goto(`/ciselniky/${first}`);
    }
  });
</script>
