<script lang="ts">
  import { page } from "$app/stores";
  import Badge from "$lib/components/badge.svelte";
  import Button from "$lib/components/button.svelte";
  import Divider from "$lib/components/divider.svelte";
  import Header from "$lib/components/header.svelte";
  import Tab from "$lib/components/tab.svelte";
  import Tabs from "$lib/components/tabs.svelte";
  import { faRotate } from "@fortawesome/free-solid-svg-icons";
  import { locationRequestsClient } from "./zadosti/location-requests-client.svelte";

  let { children } = $props();

  locationRequestsClient.find();
</script>

<Header title="Zaměstnanci">
  <Button icon={faRotate} disabled variant="ghost">Aktualizovat (dočasně nefunkční)</Button>
</Header>

<Tabs>
  <Tab href="/zamestnanci" active={$page.url.pathname === "/zamestnanci"}>Zaměstnanci</Tab>
  <Tab href="/zamestnanci/zadosti" active={$page.url.pathname === "/zamestnanci/zadosti"}>
    Žádosti <Badge small>{locationRequestsClient.items.length}</Badge>
  </Tab>
</Tabs>

<Divider />

{@render children()}
