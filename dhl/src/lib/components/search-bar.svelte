<script lang="ts">
  import { createId } from "$lib/create-id";
  import { stack } from "$lib/stack.svelte";
  import { faFilter, faSearch, faTimes } from "@fortawesome/free-solid-svg-icons";
  import { scale } from "svelte/transition";
  import Button from "./button.svelte";
  import Icon from "./icon.svelte";

  interface SearchBarProps {
    noFilters?: boolean;
    onsearch?(search: string): void;
  }

  let { noFilters, onsearch }: SearchBarProps = $props();

  let searchId = createId();

  let previousValue = $state("");
  let value = $state("");

  $effect(() => {
    if (value !== previousValue) {
      onsearch?.(value);
      previousValue = value;
    }
  });
</script>

<div class="search-bar">
  <div class="search">
    <label for={searchId} class="absolute left-[9px]">
      <Icon icon={faSearch} secondary />
    </label>

    <input bind:value id={searchId} type="text" placeholder="Vyhledat" />

    {#if value !== ""}
      <div transition:scale={{ start: 0.6, opacity: 0, duration: 400 }} class="absolute right-0">
        <Button
          onclick={() => {
            value = "";
          }}
          icon={faTimes}
          variant="ghost"
        />
      </div>
    {/if}
  </div>

  {#if !noFilters}
    <Button onclick={() => stack.openFilters()} icon={faFilter} variant="transparent">Filtry</Button>
  {/if}
</div>

<style lang="scss">
  .search-bar {
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;
    gap: 12px;

    padding: 16px 20px;

    .search {
      position: relative;

      display: flex;
      flex-direction: row;
      justify-content: flex-start;
      align-items: center;

      flex: 1;

      input {
        flex: 1 1 auto;

        padding: 9px 40px 9px calc(16px + 20px);

        min-width: 0;

        font: var(--body-bold-small);
        color: var(--text-primary);

        background-color: transparent;

        border: none;
        outline: 4px solid transparent;
        border-radius: var(--medium);

        transition-property: outline;

        &::placeholder {
          color: var(--text-secondary);
        }
      }
    }
  }
</style>
