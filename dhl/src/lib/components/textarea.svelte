<script lang="ts">
  import FieldError from "./field-error.svelte";
  import FieldLabel from "./field-label.svelte";
  import Field from "./field.svelte";

  export let label: string;
  export let error: string | undefined = undefined;

  export let value = "";
  export let id: string | undefined = undefined;
  export let name: string | null | undefined = undefined;
  export let placeholder: string | null | undefined = undefined;
  export let required = false;
  export let disabled = false;
</script>

<Field>
  <FieldLabel {id} {disabled} {required}>{label}</FieldLabel>

  <textarea bind:value on:input class:error={error !== undefined} {id} {name} {placeholder} {required} {disabled}>
  </textarea>

  {#if error}
    <FieldError>
      {error}
    </FieldError>
  {/if}
</Field>

<style lang="scss">
  textarea {
    resize: none;

    padding: 11px 12px;

    font: var(--body-medium-small);
    color: var(--text-primary);

    background-color: transparent;

    border: 1px solid var(--border-light);
    outline: 1px solid transparent;
    border-radius: var(--small);

    transition-property: border, outline;

    &::placeholder {
      color: var(--text-secondary);
    }

    &:hover {
      border: 1px solid var(--border-dark);
    }

    &:focus-visible {
      border: 1px solid var(--accent-primary);
      outline: 1px solid var(--accent-primary);
    }

    &.error {
      color: var(--error-primary);

      border: 1px solid var(--error-primary);
      outline: 1px solid var(--error-primary);
    }

    &:disabled {
      color: var(--text-disabled);

      background-color: var(--action-disabled);

      border: 1px solid var(--border-light);
      outline: 1px solid transparent;
    }
  }
</style>
