<script lang="ts">
  import { createId } from "$lib/create-id";

  export let id = createId();
  export let name: string | undefined = undefined;
  export let checked: boolean = false;
  export let group: string = "";
  export let value: string = "";
  export let required: boolean = false;
  export let disabled: boolean = false;
  export let readonly: boolean = false;
</script>

<label class="flex flex-row">
  <div class="button" class:disabled>
    <span class="thumb" class:checked></span>
  </div>
  <input
    type="checkbox"
    tabindex="-1"
    bind:checked
    bind:group
    on:change
    {id}
    {name}
    {value}
    {required}
    {disabled}
    {readonly}
  />
</label>

<style lang="scss">
  .button {
    padding: 0.25rem;

    width: 2.5rem;

    background-color: var(--backdrop);

    border: none;
    outline: none;
    border-radius: 1rem;

    cursor: pointer;

    transition-property: opacity;

    .thumb {
      display: block;

      width: 1rem;
      height: 1rem;

      background-color: var(--text-disabled);

      border-radius: 100%;

      transition-property: transform;

      &.checked {
        transform: translate(1rem);
      }
    }

    &.disabled {
      opacity: 0.75;
    }
  }

  input {
    appearance: none;

    flex: 0 0 auto;

    margin: 0;

    width: 0;
    height: 0;
  }
</style>
