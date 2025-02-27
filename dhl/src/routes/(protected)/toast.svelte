<script lang="ts">
  import Icon from "$lib/components/icon.svelte";
  import type { IconDefinition } from "@fortawesome/fontawesome-common-types";
  import type { Snippet } from "svelte";

  interface ToastProps {
    icon?: IconDefinition;
    type?: "info" | "success" | "warning" | "error";
    children?: Snippet;
  }

  let { icon, type = "info", children }: ToastProps = $props();
</script>

<div class="toast {type ?? 'info'}">
  {#if icon}
    <div class="icon">
      <Icon {icon} />
    </div>
  {/if}

  {@render children?.()}
</div>

<style lang="scss">
  .toast {
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;

    padding: 12px;

    width: 320px;

    font: var(--body-bold-small);
    color: var(--text-primary);

    border-radius: var(--medium);

    .icon {
      margin-right: 10px;
    }

    &.info {
      background-color: var(--info-light);

      .icon {
        color: var(--info-primary);
      }
    }

    &.success {
      background-color: var(--success-light);

      .icon {
        color: var(--success-primary);
      }
    }

    &.warning {
      background-color: var(--warning-light);

      .icon {
        color: var(--warning-primary);
      }
    }

    &.error {
      background-color: var(--error-light);

      .icon {
        color: var(--error-primary);
      }
    }
  }
</style>
