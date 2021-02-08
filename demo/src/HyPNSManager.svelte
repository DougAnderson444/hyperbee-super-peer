<script>
  import { onMount } from "svelte";
  import HyPNSComponent from "hypns-svelte-component";
  //stores
  import {
    hypnsNode, // bound to HyPNS component, will get its value from there
  } from "./js/stores.js";

  let wsProxy = [
    "wss://super.peerpiper.io:49777",
    "wss://hyperswarm.mauve.moe",
  ];
  let opts = {
    persist: true,
    swarmOpts: { announceLocalAddress: true, wsProxy },
  };
</script>

{#if HyPNSComponent}
  <svelte:component this={HyPNSComponent} bind:hypnsNode={$hypnsNode} {opts} />
{/if}

<style>
</style>
