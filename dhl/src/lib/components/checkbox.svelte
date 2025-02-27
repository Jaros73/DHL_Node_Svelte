<script lang="ts">
  import { createId } from "$lib/create-id";
  import { faCheck, faMinus } from "@fortawesome/free-solid-svg-icons";
  import Icon from "./icon.svelte";

  export let id = createId();
  export let name: string | undefined = undefined;
  export let label: string | undefined = undefined;
  export let checked: boolean = false;
  export let group: string = "";
  export let value: string = "";
  export let indeterminate: boolean = false;
  export let required: boolean = false;
  export let disabled: boolean = false;
  export let readonly: boolean = false;
</script>

<label class="checkbox" class:disabled>
  <input
    type="checkbox"
    bind:checked
    bind:group
    on:input
    on:change
    {id}
    {name}
    {value}
    {required}
    {disabled}
    {readonly}
  />
  <div class="check-mark">
    {#if checked}
      <Icon icon={indeterminate ? faMinus : faCheck} />
    {/if}
  </div>
  {#if label}
    <div class="label">
      {label}
    </div>
  {/if}
</label>

<style lang="scss">
  .checkbox {
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;

    cursor: pointer;

    input {
      appearance: none;

      flex: 0 0 auto;

      margin: 0;
    }

    .check-mark {
      display: flex;
      justify-content: center;
      align-items: center;

      width: 20px;
      height: 20px;

      color: var(--text-contrast);

      border: 1px solid var(--border-light);
      outline: 3px solid transparent;
      border-radius: var(--small);

      box-shadow: var(--xs);

      pointer-events: none;
    }

    input:checked + .check-mark {
      background-color: var(--accent-primary);

      border: var(--accent-primary);

      opacity: 1;
    }

    .label {
      margin-left: 16px;

      font: var(--body-medium-small);
      color: var(--text-primary);
    }

    &:hover,
    &:focus-within {
      .check-mark {
        outline: 3px solid var(--action-light);

        box-shadow: none;
      }
    }

    &.disabled {
      .check-mark {
        color: var(--text-secondary);

        background-color: var(--action-disabled);

        border: 1px solid var(--border-disabled);

        box-shadow: none;
      }
    }
  }
</style>
