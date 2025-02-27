<script lang="ts">
  import { faFaceMehBlank } from "@fortawesome/free-regular-svg-icons";
  import type { Snippet } from "svelte";
  import Icon from "./icon.svelte";
  import Text from "./text.svelte";

  interface EmptyStateProps {
    title: string;
    children?: Snippet;
  }

  let { title, children }: EmptyStateProps = $props();
</script>

<section>
  <Icon icon={faFaceMehBlank} secondary />
  <Text font="subheadline-medium-large" color="primary">{title}</Text>
  <Text color="secondary">
    {@render children?.()}
  </Text>
</section>

<style lang="scss">
  section {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
    gap: 8px;

    margin: 0 25vw;

    height: 100vh;
    height: 100dvh;

    text-align: center;
  }
</style>
