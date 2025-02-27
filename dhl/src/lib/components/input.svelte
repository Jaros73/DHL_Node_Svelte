<script lang="ts">
  import type { HTMLInputTypeAttribute } from "svelte/elements";
  import FieldError from "./field-error.svelte";
  import FieldLabel from "./field-label.svelte";
  import Field from "./field.svelte";

  export let label: string | undefined = undefined;
  export let error: string | undefined = undefined;
  export let right = false;

  export let value: string | number | undefined = "";
  export let type: HTMLInputTypeAttribute | null | undefined = undefined;
  export let id: string | undefined = undefined;
  export let form: string | undefined = undefined;
  export let name: string | null | undefined = undefined;
  export let placeholder: string | null | undefined = undefined;
  export let inputmode:
    | "email"
    | "search"
    | "tel"
    | "text"
    | "url"
    | "none"
    | "numeric"
    | "decimal"
    | null
    | undefined = undefined;
  export let autocomplete: string | null | undefined = undefined;
  export let list: string | null | undefined = undefined;
  export let required = false;
  export let disabled = false;

  function handleOnInput(e: Event & { currentTarget: HTMLInputElement }) {
    value = e.currentTarget.value;
  }
</script>

<Field>
  {#if label}
    <FieldLabel {id} {disabled} {required}>{label}</FieldLabel>
  {/if}

  <div class="field" class:error class:disabled>
    {#if $$slots.lead}
      <label for={id}>
        <slot name="lead" />
      </label>
    {/if}

    <input
      on:input={handleOnInput}
      on:input
      class:right
      class:error
      {type}
      {value}
      {id}
      {name}
      {form}
      {placeholder}
      {inputmode}
      {autocomplete}
      {list}
      {required}
      {disabled}
    />

    {#if $$slots.tail}
      <label for={id}>
        <slot name="tail" />
      </label>
    {/if}
  </div>

  {#if error}
    <FieldError>
      {error}
    </FieldError>
  {/if}
</Field>

<style lang="scss">
  .field {
    display: flex;
    flex-direction: row;
    justify-items: flex-start;
    align-items: center;

    padding: 2px;

    border: 1px solid var(--border-light);
    outline: 1px solid transparent;
    border-radius: var(--medium);

    transition-property: border, outline;

    input {
      flex: 1 1 auto;

      align-self: stretch;

      padding: 6px 8px;

      height: 34px;
      min-width: 0;

      font: var(--body-medium-small);
      color: var(--text-primary);

      background-color: transparent;

      border: none;
      outline: none;
      border-radius: var(--medium);

      &::placeholder {
        color: var(--text-secondary);
      }

      &.right {
        text-align: right;
      }
    }

    &:hover {
      border: 1px solid var(--border-dark);
    }

    &:focus-within {
      border: 1px solid var(--accent-primary);
      outline: 1px solid var(--accent-primary);
    }

    &.error {
      border: 1px solid var(--error-primary);
      outline: 1px solid var(--error-primary);

      input {
        color: var(--error-primary);
      }
    }

    &.disabled {
      background-color: var(--action-disabled);

      border: 1px solid var(--border-light);
      outline: 1px solid transparent;

      input {
        color: var(--text-disabled);
      }
    }
  }
</style>
