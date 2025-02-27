<script lang="ts">
  import { page } from "$app/stores";
  import Icon from "$lib/components/icon.svelte";
  import type { IconDefinition } from "@fortawesome/free-solid-svg-icons";
  import type { Snippet } from "svelte";

  interface NavItemProps {
    icon: IconDefinition;
    href: string;
    active?: boolean;
    children?: Snippet;
  }

  let { icon, href, active, children }: NavItemProps = $props();
</script>

<a class:active={active !== undefined ? active : $page.url.pathname.startsWith(href)} {href}>
  <Icon {icon} />

  <span>
    {@render children?.()}
  </span>
</a>

<style lang="scss">
  a {
    position: relative;

    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;

    padding: 10px;

    font-size: 1rem;
    color: var(--text-secondary);
    text-decoration: none;

    background-color: transparent;

    border: none;
    outline: 2px solid transparent;
    border-radius: var(--tiny);

    cursor: pointer;

    transition-property: color, background-color, outline;

    span {
      position: absolute;
      left: calc(100% + 8px);

      padding: 8px;

      font: var(--caption-medium);
      color: var(--text-contrast);
      white-space: nowrap;

      background-color: var(--background-contrast);

      border-radius: var(--medium);

      opacity: 0;
      transform: translateX(-8px);

      pointer-events: none;

      transition-property: transform, opacity;
    }

    &:hover {
      color: var(--text-primary);

      background-color: var(--action-light);
    }

    &:focus-visible {
      color: var(--text-primary);

      outline: 2px solid var(--accent-primary);
    }

    &.active {
      color: var(--accent-primary);

      background-color: var(--accent-background);
    }

    &:hover,
    &:focus-visible {
      span {
        opacity: 1;
        transform: translateX(0);
      }
    }
  }
</style>
