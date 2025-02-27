<script lang="ts">
  import type { IconDefinition } from "@fortawesome/fontawesome-common-types";
  import type { Snippet } from "svelte";
  import Icon from "./icon.svelte";

  interface FieldAffixProps {
    icon?: IconDefinition;
    dense?: boolean;
    children?: Snippet;
  }

  let { icon, dense, children }: FieldAffixProps = $props();
</script>

<div class="field-affix" class:dense>
  <div class="label">
    {@render children?.()}
  </div>

  {#if icon}
    <div class="icon">
      <Icon {icon} />
    </div>
  {/if}
</div>

<style lang="scss">
  .field-affix {
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;

    padding: 0 8px;

    min-width: 32px;

    border-radius: var(--small);

    white-space: nowrap;

    .label {
      padding: 5px 0;

      font: var(--body-bold-small);
      color: var(--text-secondary);
    }

    .icon {
      margin-right: -4px;

      color: var(--text-secondary);
    }

    &.dense {
      background-color: var(--background-medium);

      .label {
        font: var(--body-bold-small);
        color: var(--text-primary);
      }
    }
  }
</style>
