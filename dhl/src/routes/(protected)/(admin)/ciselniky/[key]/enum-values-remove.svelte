<script lang="ts">
  import { page } from "$app/stores";
  import Button from "$lib/components/button.svelte";
  import Dialog from "$lib/components/dialog.svelte";
  import { stack } from "$lib/stack.svelte";
  import { toast } from "$lib/toast.svelte";
  import { enumsClient } from "../enums-client.svelte";

  let valuesClient = $derived(enumsClient.values($page.params.key));
  let item = $derived(stack.remove ? valuesClient.get(Number(stack.remove)) : undefined);

  async function onsubmit() {
    if (!item?.value) {
      return;
    }

    try {
      await valuesClient.delete(item.value.id);
      toast.success("Záznam smazán.");
      stack.closeAll();
    } catch (err) {
      console.error(err);
      toast.error("Smazáni selhalo.");
    }
  }
</script>

<Dialog onclose={() => stack.closeRemove()} title="Smazat záznam" offset>
  Smazat záznam {item?.value?.name}?

  {#snippet footer()}
    <Button onclick={() => stack.closeRemove()} variant="outlined">Zavřít</Button>
    <Button onclick={() => onsubmit()} variant="primary">Smazat</Button>
  {/snippet}
</Dialog>
