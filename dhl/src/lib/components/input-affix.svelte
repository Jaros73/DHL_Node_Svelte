<script lang="ts">
  import type { IconDefinition } from "@fortawesome/fontawesome-common-types";
  import type { Snippet } from "svelte";
  import Icon from "./icon.svelte";

  let { icon, dense, children } = $props<{
    icon?: IconDefinition;
    dense?: boolean;
    children?: Snippet;
  }>();
</script>

<div class="input-affix" class:dense>
  <div class="label">
    {#if children}
      {@render children()}
    {/if}
  </div>
  {#if icon}
    <div class="icon">
      <Icon {icon} />
    </div>
  {/if}
</div>

<style lang="scss">
  .input-affix {
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;

    padding: 0 8px;

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
