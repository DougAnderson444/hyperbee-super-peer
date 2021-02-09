# hyperbee-super-peer

An simple express server that allows users to put data into a [hyperbee]() on your server. The server then keeps the hyberbee alive. It can act like a master inder hosted on a super peer in the p2p world.

## Why?

Hyperbee is a single writer, key-value database. The idea here is if you want to host a hyperbee super peer for a bunch of users, they need to be able to send their data to the master Hyperbee to write to the master hypercore. This server facilitates that.

## Steps 

### 1. Hyperspace

Start a [hyperspace](https://github.com/hypercore-protocol/hyperspace) daemon on the server / on your home computer / localhost:

```
npm i hyperspace -g
hyperspace

//=> Running hyperspace/3.18.1 win32-x64 node-v14.15.1
//=> Listening on \\.\pipe\hyperspace
```

### 2. Start the Server & client side Demo

Start the express server & Run the demo 

```
cd demo
npm run dev
```

If you want to restict write access, place a token in your `.env` file

```
# .env
TOKEN=your-toker-goes-here
```

### 3. Open browser / Access client side Demo

Goto: http://localhost:12345/?TOKEN=your-toker-goes-here

Will start the Svelte app with a simple form to post data to the server, which will save it to hyperbee. If you've saved a TOKEN in the .env file, you'll need to put that in the query params or else the server will gie you a 403 forbidden, as we may not want just anyone posting to our db.
