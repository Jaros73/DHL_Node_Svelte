<script lang="ts">
  import { createId } from "$lib/create-id";
  import { faSearch, faTimes } from "@fortawesome/free-solid-svg-icons";
  import { createEventDispatcher } from "svelte";
  import { scale } from "svelte/transition";
  import Button from "./button.svelte";
  import Icon from "./icon.svelte";

  let dispatch = createEventDispatcher<{ clear: void }>();

  export let id = createId();
  export let name = "search";
  export let value = "";

  async function clean() {
    value = "";
    dispatch("clear");
  }
</script>

<div class="relative flex flex-row justify-start items-center flex-1">
  <label for={id} class="absolute left-[9px]">
    <Icon icon={faSearch} secondary />
  </label>

  <input {id} {name} bind:value on:input type="text" placeholder="Vyhledat" />

  {#if value !== ""}
    <div transition:scale={{ start: 0.6, opacity: 0, duration: 400 }} class="absolute right-0">
      <Button on:click={() => clean()} icon={faTimes} variant="ghost" />
    </div>
  {/if}
</div>

<style lang="scss">
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
</style>
