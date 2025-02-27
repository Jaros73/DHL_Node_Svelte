<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";

  interface TabLinkProps extends HTMLAttributes<EventTarget> {
    stretch?: boolean;
    href?: string;
    active?: boolean;
    children?: Snippet;
  }

  let { stretch, href, active, children, ...rest }: TabLinkProps = $props();
  let element = $derived<"a" | "button">(href ? "a" : "button");
</script>

<svelte:element this={element} {href} class="tab" class:active class:stretch {...rest}>
  {@render children?.()}
</svelte:element>

<style lang="scss">
  .tab {
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    gap: 6px;

    padding: 9px 20px;

    font: var(--body-bold-small);
    color: var(--text-secondary);

    box-shadow: 0 1px 0 transparent;

    transition-property: color, box-shadow;

    &.stretch {
      flex: 1 1 auto;
    }

    &:hover,
    &:focus-visible,
    &.active {
      color: var(--accent-primary);

      outline: none;

      box-shadow: 0 1px 0 var(--accent-primary);
    }
  }
</style>
