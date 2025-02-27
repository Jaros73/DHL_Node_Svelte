<script lang="ts">
  import Button from "./button.svelte";

  interface NextButtonProps {
    hasNext?: boolean;

    onclick?(): void;
  }

  let { hasNext, onclick }: NextButtonProps = $props();
</script>

<div class="flex justify-center items-center py-[20px]">
  <Button {onclick} variant="outlined" disabled={!hasNext}>Další</Button>
</div>
