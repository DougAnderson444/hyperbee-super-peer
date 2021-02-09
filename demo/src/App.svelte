<script>
  import { onMount } from "svelte";
  import HyPNSManager from "./HyPNSManager.svelte";
  import Hyperbee from "hyperbee-svelte-component";
  import Autocomplete from "simply-svelte-autocomplete";

  //stores
  import {
    hypnsNode, // bound to HyPNS component, will get its value from there
  } from "./js/stores.js";

  export let name;
  export let id;

  export let db;

  let opts = { keyEncoding: "utf-8", valueEncoding: "utf-8" };
  let feed;
  let mounted;
  let display = true;
  let allValues = new Map();
  let search = "";
  let searchResults;
  let results;

  let key = "be8cd15d35ed0fea884631ac9161af4b2150aaf54d175c436ab4a62f236976a9"; // replace with your server key

  let list;
  let input;
  let isOpen = false;
  let arrowCounter = 0;
  let isLoading = false;
  let fromStart = true; // Default type ahead
  let maxItems = 5;
  onMount(async () => {
    mounted = true;
  });

  $: mounted && $hypnsNode ? open() : null;

  const open = async () => {
    const f = $hypnsNode.store.get({ key });
    await f.ready();
    feed = f;

    feed.on("peer-open", (peer) => {
      console.log("peer open");
    });
    feed.createReadStream({ live: true }).on("data", (d) => {
      readStream();
    });
    $hypnsNode.swarmNetworker.configure(feed.discoveryKey, {
      announce: true,
      lookup: true,
      live: true,
    });
  };

  /**
   * Logic to post the new data to the server side
   */
  const params = new URLSearchParams(window.location.search);
  const TOKEN = params.get("TOKEN");

  const handleSubmit = async () => {
    let dataObj = {
      name,
      id,
    };
    const resp = await postData(`/hyperbee/add/`, dataObj);
    name = "";
    id = "";
  };

  async function postData(url = "", data = {}) {
    const response = await fetch(url, {
      method: "POST", // *GET, POST, PUT, DELETE, etc.
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${TOKEN}`,
      },
      body: JSON.stringify(data), // body data type must match "Content-Type" header
    });
    return await response.json(); // parses JSON response into native JavaScript objects
  }

  $: feed && db && typeof db.createReadStream === "function"
    ? readStream()
    : null;

  const readStream = async () => {
    console.log("initializing");
    const readStream = db.createReadStream();
    readStream.on("data", ({ key, value }) => {
      allValues.set(key.toString(), value.toString());
      allValues = allValues;
    });
  };

  const onChange = () => {};

  const searchInputHandler = async (e) => {
    search = search.replace(/[`~!@#$%^&*()|+=?;:'",.<>\{\}\[\]\\\/]/gi, "");
    isOpen = true;
    searchResults = await postData(`/hyperbee/search/${search}`, {});
    filterResults();
  };

  const regExpEscape = (s) => {
    return s.replace(/[-\\^$*+?.()|[\]{}]/g, "\\$&");
  };

  function filterResults() {
    results = searchResults
      .filter((item) => {
        if (typeof item !== "string") {
          item = item.key || ""; // Silent fail
        }
        return fromStart
          ? item.toUpperCase().startsWith(search.toUpperCase())
          : item.toUpperCase().includes(search.toUpperCase());
      })
      .map((item) => {
        const text = typeof item !== "string" ? item.key : item;
        return {
          key: text,
          value: item.value || item,
          label:
            search.trim() === ""
              ? text
              : text.replace(
                  RegExp(regExpEscape(search.trim()), "i"),
                  "<span>$&</span>"
                ),
        };
      });
    const height = results.length > maxItems ? maxItems : results.length;
    list.style.height = `${height * 2.25}rem`;
  }

  function onKeyDown(event) {
    if (event.keyCode === 40 && arrowCounter < results.length) {
      // ArrowDown
      arrowCounter = arrowCounter + 1;
    } else if (event.keyCode === 38 && arrowCounter > 0) {
      // ArrowUp
      arrowCounter = arrowCounter - 1;
    } else if (event.keyCode === 13) {
      // Enter
      event.preventDefault();
      console.log("Enter", arrowCounter);
      if (arrowCounter === -1) {
        arrowCounter = 0; // Default select first item of list
      }
      close(arrowCounter);
    } else if (event.keyCode === 27) {
      // Escape
      event.preventDefault();
      console.log("Escape", arrowCounter, event.keyCode);
      close();
    }
  }

  function close(index = -1) {
    console.log("close called", { index });
    isOpen = false;
    arrowCounter = -1;
    input.blur();
    if (index > -1) {
      const { key, value } = results[index];
      search = key;
    } else if (!value) {
      search = "";
    }
  }
</script>

<svelte:window
  on:keydown={onKeyDown}
  on:click={() => {
    isOpen = false;
  }}
/>

<svelte:head>
  <link
    rel="stylesheet"
    href="https://cdnjs.cloudflare.com/ajax/libs/bulma/0.7.1/css/bulma.min.css"
  />
  <link
    rel="stylesheet"
    href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css"
  />
</svelte:head>

<main>
  <h1>Hyperbee Express Svelte Demo!</h1>
  <p>Enter a name and key to save to the hyperbee on the server.</p>
  <div>
    <form class="form" on:submit|preventDefault={handleSubmit}>
      <br />
      <label for="name">Name:</label>
      <input
        type="text"
        id="name"
        name="name"
        bind:value={name}
        placeholder="Name"
      />
      <br /><br />
      <label for="id">ID:</label>
      <input
        type="text"
        id="id"
        name="id"
        bind:value={id}
        placeholder="Value"
      />
      <br /><br />
      <button class="raised"> Save </button>
    </form>
  </div>
  <HyPNSManager />
  {#if feed}
    <Hyperbee {feed} {opts} {display} bind:db />
  {/if}
  <div class="container">
    <div class="content">
      <div class="field">
        <label class="label" for="autocomplete">Search</label>
        <div on:click|stopPropagation class="autocomplete">
          <input
            type="text"
            id="search"
            name="search"
            bind:value={search}
            on:input={searchInputHandler}
            on:focus={() => {
              isOpen = true;
            }}
            on:keydown={onKeyDown}
            placeholder="Search"
            bind:this={input}
          />
          <ul
            class="autocomplete-results{!isOpen ? ' hide-results' : ''}"
            bind:this={list}
          >
            {#if results}
              {#each results as result, i}
                <li
                  on:click={() => close(i)}
                  class="autocomplete-result{i === arrowCounter
                    ? ' is-active'
                    : ''}"
                >
                  {@html result.label}
                  {result.value}
                </li>
              {/each}
            {/if}
          </ul>
          {#if isLoading}
            <slot>
              <p class="fallback">Loading data...</p>
            </slot>
          {/if}
        </div>
      </div>
    </div>
  </div>

  <div>
    <p>
      {#if allValues && allValues.size > 0}
        All Values: {allValues.size}<br />
        <ul>
          {#each [...allValues.entries()] as [key, value]}
            <li>{key.toString()}: {value.toString()}</li>
          {/each}
        </ul>
      {/if}
    </p>
  </div>
</main>

<style>
  main {
    text-align: center;
    padding: 1em;
    max-width: 240px;
    margin: 0 auto;
  }

  h1 {
    color: #ff3e00;
    text-transform: uppercase;
    font-size: 4em;
    font-weight: 100;
  }

  @media (min-width: 640px) {
    main {
      max-width: none;
    }
  }
  .container {
    max-width: 192px;
  }
  * {
    box-sizing: border-box;
  }

  input {
    height: 2rem;
    font-size: 1rem;
    padding: 0.25rem 0.5rem;
  }

  .autocomplete {
    position: relative;
  }

  .hide-results {
    display: none;
  }

  .autocomplete-results {
    padding: 0;
    margin: 0;
    border: 1px solid #dbdbdb;
    height: 6rem;
    overflow: auto;
    width: 100%;

    background-color: white;
    box-shadow: 2px 12px 24px rgba(0, 0, 0, 0.2);
    position: absolute;
    z-index: 100;
  }

  .autocomplete-result {
    color: #7a7a7a;
    list-style: none;
    text-align: left;
    height: 2rem;
    padding: 0.25rem 0.5rem;
    cursor: pointer;
  }

  .autocomplete-result > :global(span) {
    background-color: none;
    color: #242424;
    font-weight: bold;
  }

  .autocomplete-result.is-active,
  .autocomplete-result:hover {
    background-color: #dbdbdb;
  }
</style>
