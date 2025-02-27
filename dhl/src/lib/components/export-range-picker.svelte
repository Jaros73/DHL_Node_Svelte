<script lang="ts">
  import Button from "$lib/components/button.svelte";
  import Dialog from "$lib/components/dialog.svelte";
  import FieldGrid from "$lib/components/field-grid.svelte";
  import Input from "$lib/components/input.svelte";
  import { formatDateTimeInput, inputDateTimeToISO } from "$lib/format";
  import { resource } from "$lib/resource";
  import { stack } from "$lib/stack.svelte";
  import { toast } from "$lib/toast.svelte";
  import { DateTime } from "luxon";

  interface ExporRangePickerProps {
    fieldName?: string;

    onexport?([from, to]: [string, string]): Promise<boolean>;
  }

  let { fieldName = "Vytvořeno", onexport }: ExporRangePickerProps = $props();

  let errors = $state<Record<string, string>>({});
  function validate(data: FormData): undefined | { from: string; to: string } {
    errors = {};

    let from = inputDateTimeToISO(data.get("dateFrom") as string);
    let to = inputDateTimeToISO(data.get("dateTo") as string);

    if (!from) {
      errors.dateFrom = resource.formError("required");
    }

    if (!to) {
      errors.dateTo = resource.formError("required");
    }

    return Object.keys(errors).length > 0 ? undefined : { from: from!, to: to! };
  }

  let submitting = $state(false);
  async function onsubmit(e: Event & { currentTarget: HTMLFormElement }) {
    e.preventDefault();

    if (!onexport) {
      return;
    }

    let form = e.currentTarget;
    let data = new FormData(form);
    let payload = validate(data);
    if (!payload) {
      return;
    }

    submitting = true;
    let success = await onexport([payload.from, payload.to]);
    submitting = false;

    if (success) {
      stack.closeExport();
    } else {
      toast.error("Export selhal.");
    }
  }
</script>

<Dialog onclose={() => stack.closeExport()} title="Export" offset>
  <form {onsubmit} method="post" id="export-range-picker" novalidate>
    <FieldGrid cols={2} title={fieldName}>
      <Input
        id="dateFrom"
        name="dateFrom"
        type="datetime-local"
        label="Od"
        error={errors.dateFrom}
        on:input={() => {
          delete errors.dateFrom;
        }}
        disabled={submitting}
        required
      />
      <Input
        id="dateTo"
        name="dateTo"
        type="datetime-local"
        label="Do"
        value={formatDateTimeInput(new Date().toISOString())}
        error={errors.dateTo}
        on:input={() => {
          delete errors.dateTo;
        }}
        disabled={submitting}
        required
      />
    </FieldGrid>
  </form>

  {#snippet footer()}
    <Button onclick={() => stack.closeExport()} disabled={submitting} variant="outlined">Zavřít</Button>
    <Button disabled={submitting} form="export-range-picker" type="submit" variant="primary">Export</Button>
  {/snippet}
</Dialog>
