<script>
	export let name;
	export let id;
	const params = new URLSearchParams(window.location.search);
	const TOKEN = params.get("TOKEN");

	const handleSubmit = async () => {
		let dataObj = {
			name,
			id,
		};

		const resp = await postData(
			`http://localhost:12345/hyperbee/add/`,
			dataObj
		);
		name = "";
		id = "";
	};

	async function postData(url = "", data = {}) {
		const response = await fetch(url, {
			method: "POST", // *GET, POST, PUT, DELETE, etc.
			headers: {
				"Content-Type": "application/json",
				// 'Content-Type': 'application/x-www-form-urlencoded',
				Authorization: `Bearer ${TOKEN}`,
			},
			body: JSON.stringify(data), // body data type must match "Content-Type" header
		});
		return await response.json(); // parses JSON response into native JavaScript objects
	}
</script>

<main>
	<h1>Hyperbee Express Svelte Demo</h1>
	<p>Enter a name and key to save tot he hyperbee on the server.</p>
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
				placeholder="Id"
			/>
			<br /><br />
			<button class="raised"> Save </button>
		</form>
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
