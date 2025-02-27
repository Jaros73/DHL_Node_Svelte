<script lang="ts">
  import type { IconDefinition } from "@fortawesome/fontawesome-common-types";
  import type { Snippet } from "svelte";
  import type { HTMLButtonAttributes } from "svelte/elements";
  import Icon from "./icon.svelte";

  interface ButtonProps extends HTMLButtonAttributes {
    icon?: IconDefinition;
    variant?: "primary" | "secondary" | "outlined" | "transparent" | "ghost";
    small?: boolean;
    destructive?: boolean;
    children?: Snippet;
  }

  let { icon, variant = "primary", small, destructive, children, type = "button", ...rest }: ButtonProps = $props();
</script>

<button class={variant} class:small class:destructive class:icon-only={!children} {type} {...rest}>
  {#if icon}
    <div class="icon">
      <Icon {icon} />
    </div>
  {/if}

  {@render children?.()}
</button>

<style lang="scss">
  button {
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: baseline;

    padding: 9px 14px;

    min-width: 40px;

    font: var(--button-medium);
    line-height: 20px;
    text-align: center;
    color: var(--text-primary);

    border: 1px solid transparent;
    outline: 3px solid transparent;
    border-radius: var(--small);

    cursor: pointer;

    transition-property: color, background-color, outline;

    &:disabled {
      cursor: default;
    }

    &.primary {
      color: var(--accent-contrast);
      background-color: var(--accent-primary);

      &:hover {
        background-color: var(--accent-light);
      }

      &:focus-visible,
      &:active {
        outline: 3px solid var(--accent-background);
      }

      &:disabled {
        color: var(--text-disabled);
        background-color: var(--action-disabled);
        border: 1px solid var(--border-dark);
      }

      &.destructive {
        color: var(--text-contrast);
        background-color: var(--error-primary);

        &:hover {
          background-color: var(--error-medium);
        }

        &:focus-visible,
        &:active {
          outline: 3px solid var(--error-light);
        }
      }
    }

    &.secondary {
      color: var(--text-primary);
      background-color: var(--action-light);

      &:hover {
        color: var(--text-primary);
        background-color: var(--action-dark);
      }

      &:focus-visible,
      &:active {
        outline: 3px solid var(--accent-background);
      }

      &:disabled {
        color: var(--text-disabled);
        background-color: var(--action-disabled);
      }

      &.destructive {
        color: var(--error-primary);

        &:focus-visible,
        &:active {
          outline: 3px solid var(--error-light);
        }
      }
    }

    &.outlined {
      background-color: var(--background-surface);
      border: 1px solid var(--border-light);

      &:hover {
        border: 1px solid var(--border-dark);
      }

      &:focus-visible,
      &:active {
        border: 1px solid var(--border-dark);
        outline: 3px solid var(--border-focus);
      }

      &:disabled {
        color: var(--text-disabled);
        background-color: var(--action-disabled);
        border: 1px solid var(--border-disabled);
      }

      &.destructive {
        color: var(--error-primary);

        &:hover {
          border: 1px solid var(--error-primary);
        }

        &:focus-visible,
        &:active {
          border: 1px solid var(--error-primary);
          outline: 3px solid var(--error-light);
        }
      }
    }

    &.transparent {
      color: var(--text-secondary);
      background-color: transparent;

      &:hover {
        color: var(--text-primary);
        background-color: var(--action-light);
      }

      &:focus-visible,
      &:active {
        color: var(--text-primary);
        outline: none;
      }

      &:disabled {
        color: var(--text-disabled);
        background-color: transparent;
      }

      &.destructive {
        color: var(--error-primary);

        &:focus-visible,
        &:active {
          outline: 3px solid var(--error-light);
        }
      }
    }

    &.ghost {
      color: var(--text-secondary);

      background-color: transparent;

      border: 1px solid transparent;

      &:hover {
        color: var(--text-primary);
      }

      &:focus-visible,
      &:active {
        color: var(--accent-primary);

        outline: none;
      }

      &:disabled {
        color: var(--text-disabled);
      }

      &.destructive {
        color: var(--error-primary);

        &:focus-visible,
        &:active {
          outline: 2px solid var(--error-primary);
        }
      }
    }

    &.small {
      padding: 5px 9px;

      min-width: 32px;

      font: var(--button-small);
      line-height: 20px;
    }

    .icon {
      margin: auto 6px auto -4px;
    }

    &.icon-only {
      padding: 9px;

      min-width: unset;

      &.small {
        padding: 5px;

        min-width: unset;
      }

      .icon {
        margin: auto;
      }
    }
  }
</style>
