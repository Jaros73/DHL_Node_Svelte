<script lang="ts">
  import type { IconDefinition } from "@fortawesome/fontawesome-common-types";
  import Fa from "svelte-fa";

  export let icon: IconDefinition;
  export let flip: "horizontal" | "vertical" | "both" | undefined = undefined;
  export let secondary = false;
  export let spin = false;
</script>

<div class="icon" class:secondary>
  <Fa {icon} {flip} {spin} />
</div>

<style lang="scss">
  .icon {
    display: flex;
    justify-content: center;
    align-items: center;

    width: 20px;
    height: 20px;

    font-size: 15px;

    &.secondary {
      color: var(--text-secondary);
    }
  }
</style>
