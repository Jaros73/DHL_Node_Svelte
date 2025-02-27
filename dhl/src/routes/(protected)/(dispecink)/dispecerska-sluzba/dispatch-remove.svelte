<script lang="ts">
  import { dispatchClient } from "./dispatch-client";
  import Button from "$lib/components/button.svelte";
  import Dialog from "$lib/components/dialog.svelte";
  import { formatDateTime } from "$lib/format";
  import { stack } from "$lib/stack.svelte";
  import { toast } from "$lib/toast.svelte";

  let item = $derived(stack.remove ? dispatchClient.get(Number(stack.remove)) : undefined);

  async function onsubmit() {
    if (!item?.value) {
      return;
    }

    try {
      await dispatchClient.delete(item.value.id);
      toast.success("Záznam smazán.");
      stack.closeAll();
    } catch (err) {
      console.error(err);
      toast.error("Smazáni selhalo.");
    }
  }
</script>

<Dialog onclose={() => stack.closeRemove()} title="Smazat záznam" offset>
  Smazat záznam {item?.value?.locationName} k datu {formatDateTime(item?.value?.userTime)}?

  {#snippet footer()}
    <Button onclick={() => stack.closeRemove()} variant="outlined">Zavřít</Button>
    <Button onclick={() => onsubmit()} variant="primary">Smazat</Button>
  {/snippet}
</Dialog>
