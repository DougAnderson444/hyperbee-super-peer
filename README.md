# hyperbee-super-peer

A simple express server that allows users to write data into a [hyperbee]() on your server. The server then keeps the hyberbee alive. It can act like a master index hosted on a super peer in the p2p world. Users can get data from any hyperbee with the same key, but only this one can write.

## Why?

Hyperbee is a single writer, key-value database. The idea here is if you want to host a hyperbee super peer for a bunch of users to write to, they need to be able to send their data to the master Hyperbee to write to the master hypercore. This server facilitates that.

However, since Hyperbee is peer to peer, anyone also using the btree can also provide the data in the event the master node is down.

## Steps to running your own hyperbee superpeer Node

### 1. Hyperspace

Start a [hyperspace](https://github.com/hypercore-protocol/hyperspace) daemon on the server / on your home computer / localhost:

```
npm i hyperspace -g
hyperspace

//=> Running hyperspace/3.18.1 win32-x64 node-v14.15.1
//=> Listening on \\.\pipe\hyperspace
```

hyperbee super-peer won't run without a hyperspace running in the background. It gets the corestore from hyperspace, so it needs to be up and running first.

### 2. Start the Server 

The hyperbee superpeer server can be started independently, or combined with the user interface demo (recommended)

Option A: With Demo. Run the demo: 

```
cd ./demo
npm run dev
```

The svelte UI will spin up, and create a hyperbee in the background and spit out it's public key in the console. Grab that, and you'll need to pass it with any requests to show the list of current hyperbee entries:

```
key: be8cd15d35ed0fea884631ac....
```

If you want to restict write access, place a token in your `.env` file. Once your key is created, you can also save it there for easy access:

```
# .env
TOKEN=your-token-goes-here
KEY=be8cd15d35ed0fea884631ac....
```

What's with the key? Your client needs to know which hyperbee to look up to display the search results in the demo. It's not needed to just run the server in the background.

Option B: Background server.

To simply run the hyperbee superpeer as a bg server, just run it:

```
cd .
npm run start
```

### 3. Open browser / Access client side Demo

Goto: http://localhost:12345/hyperbee/?TOKEN=your-token-goes-here&KEY=be8cd15d35ed0fea884631ac.... etc

Will start the Svelte app with a simple form to post data to the server, which will save it to hyperbee. If you've saved a TOKEN in the .env file, you'll need to put that in the query params or else the server will gie you a 403 forbidden, as we may not want just anyone posting to our db.
