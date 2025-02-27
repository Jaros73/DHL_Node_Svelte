<script lang="ts">
  import type { Snippet } from "svelte";

  interface FieldLabelProps {
    id?: string | null | undefined;
    disabled?: boolean;
    required?: boolean;
    children?: Snippet;
  }

  let { id, disabled, required, children }: FieldLabelProps = $props();
</script>

<label for={id} class:disabled class:required>
  {@render children?.()}
</label>

<style lang="scss">
  label {
    flex: 0 1 auto;

    font: var(--button-medium);
    color: var(--text-primary);

    &.disabled {
      color: var(--text-disabled);
    }

    &.required::after {
      content: " *";

      font: var(--button-medium);
      color: var(--error-primary);
    }
  }
</style>
