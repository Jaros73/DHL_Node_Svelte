<script lang="ts">
  import FieldError from "./field-error.svelte";
  import FieldLabel from "./field-label.svelte";
  import Field from "./field.svelte";

  type Option = {
    value: string | number;
    label: string | number;
  };

  export let label: string;
  export let options: Option[] = [];
  export let error: string | undefined = undefined;

  export let value: string | number | undefined = undefined;
  export let id: string | null | undefined = undefined;
  export let name: string | null | undefined = undefined;
  export let required = false;
  export let disabled = false;
</script>

<Field>
  <FieldLabel {id} {disabled} {required}>{label}</FieldLabel>

  <div class="input" class:error class:disabled>
    {#if $$slots.lead}
      <label for={id}>
        <slot name="lead" />
      </label>
    {/if}

    <select bind:value on:change class:error {id} {name} {required} {disabled}>
      <option value="" class="hidden"></option>
      {#each options as option (option.value)}
        <option value={option.value}>{option.label}</option>
      {/each}
    </select>

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
  .input {
    display: flex;
    flex-direction: row;
    justify-items: flex-start;
    align-items: center;

    padding: 2px;

    border: 1px solid var(--border-light);
    outline: 1px solid transparent;
    border-radius: var(--medium);

    transition-property: border, outline;

    select {
      flex: 1 1 auto;

      align-self: stretch;

      padding: 6px 8px;

      height: 34px;

      font: var(--body-medium-small);
      color: var(--text-primary);

      background-color: transparent;

      border: none;
      outline: none;
      border-radius: var(--medium);

      &::placeholder {
        color: var(--text-secondary);
      }

      option {
        padding: 0 12px;

        font: var(--body-medium-small);
        color: var(--text-primary);

        background-color: var(--background-light);
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

      select {
        color: var(--error-primary);
      }
    }

    &.disabled {
      background-color: var(--action-disabled);

      border: 1px solid var(--border-light);
      outline: 1px solid transparent;

      select {
        color: var(--text-disabled);
      }
    }
  }
</style>
