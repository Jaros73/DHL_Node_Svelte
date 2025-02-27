<script lang="ts">
  import type { Snippet } from "svelte";

  interface AvatarProps {
    small?: boolean;
    children?: Snippet;
  }

  let { small, children }: AvatarProps = $props();
</script>

<div class="avatar" class:small>
  {@render children?.()}
</div>

<style lang="scss">
  .avatar {
    display: flex;
    justify-content: center;
    align-items: center;

    width: 40px;
    height: 40px;

    font: var(--body-bold-small);
    color: var(--accent-primary);

    background-color: var(--accent-background);

    border-radius: 100%;

    &.small {
      width: 20px;
      height: 20px;

      font: var(--caption-bold);
    }
  }
</style>
