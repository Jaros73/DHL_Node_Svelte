<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import { authClient } from "$lib/auth/auth-client.svelte";
  import Splash from "$lib/components/splash.svelte";
  import { onMount } from "svelte";

  const LOGIN_PATH = "/api/auth/web/login";

  let isError = $state(false);

  onMount(async () => {
    let code = $page.url.searchParams.get("code");
    if (!code) {
      globalThis.location.assign(LOGIN_PATH);
      return;
    }

    if (!(await authClient.authenticate(code))) {
      isError = true;
      return;
    }

    let returnPath = globalThis.localStorage.getItem("loginReturnPath");
    globalThis.localStorage.removeItem("loginReturnPath");
    if (!returnPath || returnPath.startsWith("/login") || returnPath.startsWith("/logout")) {
      return await goto("/");
    }

    return await goto(returnPath);
  });
</script>

<Splash
  title="Přihlášení{isError ? ' selhalo' : ''}"
  subtitle={isError ? "Přetrváva-li problém, kontaktujte prosím administrátora." : undefined}
  action={isError
    ? {
        href: LOGIN_PATH,
        label: "Přihlásit",
        external: true,
      }
    : undefined}
/>
