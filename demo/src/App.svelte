<script>
	import { onMount } from "svelte";
	import HyPNSManager from "./HyPNSManager.svelte";
	import Hyperbee from "hyperbee-svelte-component";

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

	let key =
		"be8cd15d35ed0fea884631ac9161af4b2150aaf54d175c436ab4a62f236976a9"; // replace with your server key

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
			console.log("Data \n", d.toString());
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
</script>

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
</style>
