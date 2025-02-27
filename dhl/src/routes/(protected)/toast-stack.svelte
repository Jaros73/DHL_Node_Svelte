<script lang="ts">
  import { portal } from "$lib/actions/portal";
  import { toast } from "$lib/toast.svelte";
  import { flip } from "svelte/animate";
  import { fade, fly } from "svelte/transition";
  import Toast from "./toast.svelte";
</script>

<div use:portal class="toast-stack">
  {#each toast.list as item (item)}
    <div animate:flip={{ duration: 150 }} in:fly={{ y: "100%", duration: 150 }} out:fade={{ duration: 150 }}>
      <Toast icon={item.icon} type={item.type}>{item.content}</Toast>
    </div>
  {/each}
</div>

<style lang="scss">
  .toast-stack {
    position: fixed;
    z-index: var(--layer-topmost);
    left: 50%;
    bottom: 0;

    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    align-items: center;
    gap: 12px;

    padding: 0 12px 12px 0;

    width: 320px;

    transform: translateX(-50%);
  }
</style>
