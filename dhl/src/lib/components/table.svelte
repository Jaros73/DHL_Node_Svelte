<script lang="ts">
  import type { Snippet } from "svelte";

  interface TableProps {
    fluid?: boolean;
    children?: Snippet;
    head?: Snippet;
    foot?: Snippet;
  }

  let { fluid = false, children, head, foot }: TableProps = $props();
</script>

<table class:fluid>
  {#if head}
    <thead>
      {@render head()}
    </thead>
  {/if}

  <tbody>
    {@render children?.()}
  </tbody>

  {#if foot}
    <tfoot>
      {@render foot()}
    </tfoot>
  {/if}
</table>

<style lang="scss">
  table {
    table-layout: fixed;

    min-width: 100%;

    border-spacing: 0;
    border-collapse: separate;

    &.fluid {
      table-layout: auto;
    }

    thead {
      background-color: var(--background-light);

      :global(th) {
        padding: 9px 8px;

        font: var(--body-bold-small);
        color: var(--text-secondary);
        text-align: left;
        text-overflow: ellipsis;
        white-space: nowrap;

        &:first-child {
          padding-left: 20px;
        }

        &:last-child {
          padding-right: 20px;
        }
      }
    }

    tbody {
      :global(td) {
        padding: 8px;

        font: var(--body-medium-small);
        text-align: left;
        text-overflow: ellipsis;
        white-space: nowrap;

        border-top: 1px solid var(--border-light);

        cursor: pointer;

        transition-property: background-color;

        &:first-child {
          padding-left: 20px;
        }

        &:last-child {
          padding-right: 20px;
        }
      }

      :global(tr:hover td) {
        background-color: var(--background-light);
      }

      :global(tr.active td) {
        background-color: var(--accent-background);
      }
    }
  }
</style>
