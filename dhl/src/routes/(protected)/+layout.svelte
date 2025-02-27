<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import { authClient } from "$lib/auth/auth-client.svelte";
  import { Role } from "$lib/auth/roles";
  import Divider from "$lib/components/divider.svelte";
  import {
    faBoxOpen,
    faGears,
    faHardHat,
    faListOl,
    faRoadBarrier,
    faTruckMoving,
    faUser,
    faWarehouse,
  } from "@fortawesome/free-solid-svg-icons";
  import { onMount } from "svelte";
  import NavItem from "./nav-item.svelte";
  import ToastStack from "./toast-stack.svelte";
  import UserMenu from "./user-menu.svelte";

  let { children } = $props();

  onMount(async () => {
    if (!(await authClient.initialize())) {
      globalThis.localStorage.setItem("loginReturnPath", $page.url.href.replace($page.url.origin, ""));
      await goto("/login");
    }
  });
</script>

{#if authClient.identity}
  <header>
    <div class="logo">DHL</div>

    <Divider />

    <nav>
      <ul>
        {#if authClient.identity.hasRole(Role.Dispecink)}
          <li>
            <NavItem icon={faHardHat} href="/dispecerska-sluzba">Dispečerská služba</NavItem>
          </li>
          <li>
            <NavItem icon={faGears} href="/vykony-mechanizace">Výkony mechanizace</NavItem>
          </li>
          <li>
            <NavItem icon={faTruckMoving} href="/kurzy">Kurzy</NavItem>
          </li>
          <li>
            <NavItem icon={faRoadBarrier} href="/mimoradne-kurzy">Mimořádné kurzy</NavItem>
          </li>
          <li>
            <NavItem icon={faBoxOpen} href="/zbytky">Zbytky</NavItem>
          </li>
        {/if}

        {#if authClient.identity.hasRole(Role.RegLogistika)}
          <li>
            <NavItem icon={faWarehouse} href="/hlaseni-rl">Hlášení RL</NavItem>
          </li>
        {/if}
      </ul>
      {#if authClient.identity.isAdmin}
        <ul>
          <li>
            <NavItem icon={faUser} href="/zamestnanci">Zaměstnanci</NavItem>
          </li>
          <li>
            <NavItem icon={faListOl} href="/ciselniky">Číselníky</NavItem>
          </li>
        </ul>
      {/if}
    </nav>

    <aside>
      <UserMenu />
    </aside>
  </header>

  <main>
    {@render children()}
  </main>

  <ToastStack />
{/if}

<style lang="scss">
  header {
    position: fixed;
    z-index: var(--layer-sheet);
    left: 0;
    top: 0;
    bottom: 0;

    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;
    gap: 16px;

    padding: 16px;

    width: 73px;

    background-color: var(--background-surface);

    border-right: 1px solid var(--border-light);

    .logo {
      margin-bottom: -1px;

      font: var(--subheadline-bold);
      line-height: 40px;
    }

    nav {
      ul {
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        align-items: center;
        gap: 8px;

        margin: 0;
        padding: 0;

        list-style-type: none;

        & + ul {
          margin-top: 8px;
          padding-top: 8px;

          border-top: 1px solid var(--divider);
        }
      }
    }

    aside {
      margin-top: auto;
    }
  }

  main {
    height: 100vh;
    height: 100dvh;

    margin-left: 73px;
  }
</style>
