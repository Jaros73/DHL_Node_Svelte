<script lang="ts">
  import Button from "$lib/components/button.svelte";
  import Dialog from "$lib/components/dialog.svelte";
  import { formatDate } from "$lib/format";
  import { stack } from "$lib/stack.svelte";
  import { toast } from "$lib/toast.svelte";
  import { remaindersClient } from "./remainders-client";

  let item = $derived(stack.remove ? remaindersClient.get(Number(stack.remove)) : undefined);

  async function onsubmit() {
    if (!item?.value) {
      return;
    }

    try {
      await remaindersClient.delete(item.value.id);
      toast.success("Záznam smazán.");
      stack.closeAll();
    } catch (err) {
      console.error(err);
      toast.error("Smazáni selhalo.");
    }
  }
</script>

<Dialog onclose={() => stack.closeRemove()} title="Smazat záznam" offset>
  Smazat záznam {item?.value?.locationName} k datu {formatDate(item?.value?.dateFor)}?

  {#snippet footer()}
    <Button onclick={() => stack.closeRemove()} variant="outlined">Zavřít</Button>
    <Button onclick={() => onsubmit()} variant="primary">Smazat</Button>
  {/snippet}
</Dialog>
