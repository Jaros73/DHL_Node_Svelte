<script lang="ts">
  import { faUpload } from "@fortawesome/free-solid-svg-icons";
  import type { HTMLInputAttributes } from "svelte/elements";
  import Icon from "./icon.svelte";
  import Text from "./text.svelte";

  let { ...rest }: HTMLInputAttributes = $props();
</script>

<div class="file-upload">
  <div class="dropzone">
    <Icon icon={faUpload} />
    <Text>Nahrajte soubory přetáhnutím, nebo klikněte zde</Text>
    <Text color="secondary">PDF, XLS, XLSX, DOC, TXT, PNG, JPG</Text>

    <input {...rest} type="file" multiple />
  </div>
</div>

<style lang="scss">
  .dropzone {
    position: relative;

    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 12px;

    padding: 24px 0;

    border: 1px solid var(--border-light);
    border-radius: var(--small);

    input {
      position: absolute;
      inset: 0;

      opacity: 0;
    }
  }
</style>
