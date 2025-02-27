<script lang="ts">
  import Text from "./text.svelte";

  interface SplashProps {
    title: string;
    subtitle?: string;
    action?: {
      href: string;
      label: string;
      external?: boolean;
    };
  }

  let { title, subtitle, action }: SplashProps = $props();
</script>

<div class="splash">
  <div class="logo">DHL</div>

  <Text font="h4">{title}</Text>
  {#if subtitle}
    <Text color="secondary">{subtitle}</Text>
  {/if}

  {#if action}
    <a href={action.href} data-sveltekit-reload={action.external ?? false}>{action.label}</a>
  {/if}
</div>

<style lang="scss">
  .splash {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;

    margin: 0 25vw;

    height: 100vh;
    height: 100dvh;

    .logo {
      margin-bottom: 20px;

      width: 40px;

      font: var(--subheadline-bold);
      line-height: 40px;
      text-align: center;
      color: var(--background-surface);

      background-color: var(--accent-primary);

      border-radius: var(--small);
    }

    a {
      margin-top: 20px;
      padding: 12px;

      font: var(--body-bold);
      color: var(--text-primary);

      background-color: var(--background-light);

      outline: 2px solid transparent;
      border-radius: var(--small);

      transition-property: background-color, outline-color;

      &:hover,
      &:focus {
        background-color: var(--action-light);

        outline-color: var(--accent-primary);
      }
    }
  }
</style>
