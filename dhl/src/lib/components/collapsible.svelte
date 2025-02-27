<script lang="ts">
  import { faChevronDown, faChevronUp } from "@fortawesome/free-solid-svg-icons";
  import type { Snippet } from "svelte";
  import { slide } from "svelte/transition";
  import Icon from "./icon.svelte";
  import Text from "./text.svelte";

  interface CollapsibleProps {
    title: string;
    passive?: boolean;
    secondary?: boolean;
    defaultExpanded?: boolean;
    children?: Snippet;
  }

  let { title, passive, secondary, defaultExpanded, children }: CollapsibleProps = $props();

  let expanded = $state(defaultExpanded);

  function toggle() {
    expanded = !expanded;
  }
</script>

<div>
  <button class:secondary onclick={toggle} disabled={passive}>
    <Text font="subheadline-bold">{title}</Text>
    {#if !passive}
      <div class="icon">
        <Icon icon={expanded ? faChevronUp : faChevronDown} />
      </div>
    {/if}
  </button>

  {#if expanded || passive}
    <div class="contents" transition:slide={{ duration: 200 }}>
      {@render children?.()}
    </div>
  {/if}
</div>

<style lang="scss">
  button {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;

    padding: 24px 20px;

    width: 100%;

    line-height: 1em;

    background-color: transparent;

    border: none;
    outline: none;

    cursor: pointer;

    transition-property: background-color;

    .icon {
      margin-right: 5px;

      color: var(--text-secondary);

      transition-property: color;
    }

    &:hover:not(:disabled) {
      background-color: var(--background-light);

      .icon {
        color: var(--text-primary);
      }
    }

    &.secondary {
      padding: 16px 12px;

      background-color: var(--background-light);

      border-radius: var(--medium);

      &:hover:not(:disabled) {
        background-color: var(--background-medium);
      }
    }

    &:disabled {
      cursor: auto;
    }
  }
</style>
