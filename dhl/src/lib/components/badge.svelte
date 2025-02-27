<script lang="ts">
  import type { IconDefinition } from "@fortawesome/fontawesome-common-types";
  import type { Snippet } from "svelte";
  import Icon from "./icon.svelte";

  interface BadgeProps {
    color?: "grey" | "blue" | "green" | "yellow" | "red";
    icon?: IconDefinition;
    small?: boolean;
    children?: Snippet;
  }

  let { color = "grey", icon, small, children }: BadgeProps = $props();
</script>

<div class="badge {color}" class:small>
  {#if icon}
    <Icon {icon} />
  {/if}

  {@render children?.()}
</div>

<style lang="scss">
  .badge {
    display: inline-flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;
    gap: 4px;

    padding: 5px 12px;

    font: var(--body-medium-small);

    border-radius: var(--tiny);

    &.grey {
      color: var(--text-primary);
      background-color: var(--action-light);
    }

    &.blue {
      color: var(--info-primary);
      background-color: var(--info-light);
    }

    &.green {
      color: var(--success-primary);
      background-color: var(--success-light);
    }

    &.yellow {
      color: var(--warning-primary);
      background-color: var(--warning-light);
    }

    &.red {
      color: var(--error-primary);
      background-color: var(--error-light);
    }

    &.small {
      padding: 0 8px;

      font: var(--caption-bold);
      line-height: 22px;
    }
  }
</style>
