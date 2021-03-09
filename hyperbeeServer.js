/**
 This server needs a hyperspace daemon up and running in the background to work
 */
require('dotenv').config()
const path = require('path')
/**
 Express stuff
 */
const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const app = express()
const port = process.env.PORT || 12345

app.use(bodyParser.json())
app.use(express.static('public'))
app.use(cors())
/**
  Hyperspace
 */
const HyperspaceClient = require('@hyperspace/client')
const Hyperbee = require('hyperbee')

/**
  Hyperspace client setup
 */
let feed
let db
/**
 * Reconnect login in case (when) Hyperspace reboots
 */
async function reconnect () {
  // wait until the server is ready
  await HyperspaceClient.serverReady({})

  const client = new HyperspaceClient()

  // wait for client to be ready
  await client.ready()

  const corestore = client.corestore()

  const checkingStatus = setInterval(checkStatus, 5000)

  async function checkStatus () {
    try {
      await client.status()
    } catch (error) {
      // no rpc, try again in a minute?
      console.error(error, '\n\n No RPC to hyperspace, waiting until the server is back\n\n')
      clearInterval(checkingStatus)
      reconnect()
      // return false
    }
  }

  try {
    await corestore.ready()
    feed = corestore.get({ name: 'hyperbee-super-peer' })
    await feed.ready()
  } catch (error) {
    console.error('Start hyperspace from the cli first')
    process.exit()
  }

  client.replicate(feed) // or feed.discoveryKey

  console.log({ key: feed.key.toString('hex') })
  console.log({ DiscoveryKey: feed.discoveryKey.toString('hex') })

  db = new Hyperbee(feed, { keyEncoding: 'utf-8', valueEncoding: 'utf-8' })
}

// initiate reconnect cycles
reconnect()

const put = async (key, value) => {
  key = key.replace(/[`~!@#$%^&*()|+=?;:'",.<>\{\}\[\]\\\/]/gi, '').toLowerCase()
  value = value.replace(/[`~!@#$%^&*()|+=?;:'",.<>\{\}\[\]\\\/]/gi, '').toLowerCase()
  await db.put(key, value)
  const node = await db.get(key) // null or { key, value }
  console.log(`hyperbee: ${node.key}, ${node.value}`)

  db.createReadStream().on('data', ({ key, value }) => {
    console.log(key.toString(), ': ', value.toString())
  })
}

const get = async (frag) => {
  // get the string that is char + 1 from the fragment sent
  function getEnd (str) {
    const len = str.length
    if (len === 1) return String.fromCharCode(str.charCodeAt(0) + 1)
    // increment only the last charCodeAt
    const last = str.slice(-1)
    const remainder = str.slice(0, -1)
    return remainder + String.fromCharCode(last.charCodeAt(0) + 1)
  }
  const end = getEnd(frag)
  console.log(`Searching ${frag} to ${end}`)
  const results = []
  for await (const item of db.createReadStream({ gte: frag, lt: end })) {
    results.push(item)
  }
  return results
}
/**
  Express server routes
 */
app.get('/hyperbee/', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'demo/public', 'index.html'))
})

app.all('/hyperbee/search/:frag', async (request, response) => {
  const frag = request.params.frag
  console.log('searching...', frag)

  const results = await get(frag)

  console.log('results: ', { results })
  response.json(results)
})

app.post('/hyperbee/add/', verifyToken, async (request, response) => {
  console.log('posting...')
  if (request.token !== process.env.TOKEN) {
    console.log('no match', request.token, process.env.TOKEN)
    return response.sendStatus(403)
  }

  const id = request.body.id
  const name = request.body.name

  put(name, id)

  console.log('posted: ', { name, id })
  response.json({ name, id })
})

// Express Middleware
function verifyToken (req, res, next) {
  const bearerHeader = req.headers.authorization
  if (bearerHeader) {
    const bearer = bearerHeader.split(' ')
    const bearerToken = bearer[1]
    req.token = bearerToken
    next()
  } else {
    // Forbidden
    res.sendStatus(403)
  }
}

const listener = app.listen(port, () => {
  console.log(`Server is up at http://localhost:${port}/hyperbee/?TOKEN=your-token-goes-here`, listener.address())
})
