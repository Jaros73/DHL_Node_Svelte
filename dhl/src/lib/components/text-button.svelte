<script lang="ts">
  import type { IconDefinition } from "@fortawesome/fontawesome-common-types";
  import type { Snippet } from "svelte";
  import type { HTMLButtonAttributes } from "svelte/elements";
  import Icon from "./icon.svelte";

  let {
    icon,
    variant = "primary",
    small,
    destructive,
    children,
    ...rest
  } = $props<
    {
      icon?: IconDefinition;
      variant?: "primary" | "secondary" | "contrast";
      small?: boolean;
      destructive?: boolean;
      children?: Snippet;
    } & HTMLButtonAttributes
  >();
</script>

<button class={variant} class:small class:destructive {...rest}>
  {#if icon}
    <div class="icon">
      <Icon {icon} />
    </div>
  {/if}
  <slot />
</button>

<style lang="scss">
  button {
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;
    gap: 8px;

    font: var(--button-medium);
    color: var(--text-primary);

    padding: 0;
    background-color: transparent;

    border: none;
    outline: 2px solid transparent;
    border-radius: var(--tiny);

    cursor: pointer;

    transition-property: color, outline;

    &:disabled {
      cursor: default;
      color: var(--text-disabled);
    }

    &.primary {
      color: var(--accent-primary);

      &:hover {
        color: var(--accent-light);
      }

      &:focus-visible,
      &:active {
        color: var(--accent-primary);
        outline: 2px solid var(--accent-primary);
      }

      &.destructive {
        color: var(--error-primary);

        &:hover {
          color: var(--error-medium);
        }

        &:focus-visible,
        &:active {
          outline: 3px solid var(--error-light);
        }
      }
    }

    &.secondary {
      color: var(--text-secondary);

      &:hover {
        color: var(--text-primary);
      }

      &:focus-visible,
      &:active {
        color: var(--text-primary);
        outline: 2px solid var(--accent-primary);
      }

      &.desctructive {
        color: var(--error-primary);
      }
    }

    &.contrast {
      color: var(--accent-contrast);

      &:hover {
        color: var(--text-contrast);
      }

      &:focus-visible,
      &:active {
        color: var(--text-contrast);
        outline: 2px solid var(--accent-primary);
      }
    }

    &.small {
      min-width: 32px;
      font: var(--button-small);
    }
  }
</style>
