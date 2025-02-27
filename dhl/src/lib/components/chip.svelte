<script lang="ts">
  import FieldLabel from "./field-label.svelte";

  export let faded = false;

  export let value: string | number | undefined;
  export let checked = false;
  export let id: string | null | undefined = undefined;
  export let name: string | null | undefined = undefined;
  export let form: string | null | undefined = undefined;
  export let required = false;
  export let disabled = false;
</script>

<FieldLabel {id} {disabled} {required}>
  <div class:checked class:disabled class:faded class="field">
    <input bind:checked type="checkbox" {id} {name} {form} {value} {required} {disabled} />

    <slot />
  </div>
</FieldLabel>

<style lang="scss">
  .field {
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;

    padding: 9px 12px;

    font: var(--body-bold-small);
    color: var(--text-primary);

    border: 1px solid var(--border-light);
    outline: 1px solid transparent;
    border-radius: var(--small);

    cursor: pointer;

    transition-property: color, background-color, border, outline, opacity;

    input {
      appearance: none;

      margin: 0;
    }

    &:hover {
      border: 1px solid var(--border-dark);
    }

    &:focus-within:has(:focus-visible) {
      color: var(--accent-primary);

      border: 1px solid var(--border-dark);
    }

    &.checked {
      background-color: var(--accent-background);

      border: 1px solid var(--accent-primary);
      outline: 1px solid var(--accent-primary);
    }

    &.disabled {
      color: var(--text-disabled);

      background-color: var(--action-disabled);

      border: 1px solid var(--border-disabled);

      cursor: default;
    }

    &.faded {
      opacity: 0.4;
    }
  }
</style>
