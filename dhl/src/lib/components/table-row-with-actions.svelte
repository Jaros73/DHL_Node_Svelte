<script lang="ts">
  import { faClone, faTrashAlt } from "@fortawesome/free-solid-svg-icons";
  import type { Snippet } from "svelte";
  import Button from "./button.svelte";
  import TableRowActions from "./table-row-actions.svelte";

  interface TableRowWithActionsProps {
    active?: boolean;
    children?: Snippet;

    open?(): void;
    clone?(): void;
    remove?(): void;
  }

  let { active, children, open, clone, remove }: TableRowWithActionsProps = $props();
</script>

<tr onclick={() => open?.()} class:active>
  {@render children?.()}

  <td>
    <TableRowActions>
      {#if clone}
        <Button
          onclick={(e) => {
            e.stopPropagation();
            clone?.();
          }}
          icon={faClone}
          variant="transparent"
          small
        />
      {/if}

      {#if remove}
        <Button
          onclick={(e) => {
            e.stopPropagation();
            remove?.();
          }}
          icon={faTrashAlt}
          variant="transparent"
          small
        />
      {/if}
    </TableRowActions>
  </td>
</tr>
