
import { ApiPromise, WsProvider } from '@polkadot/api';
import { hexToString } from '@polkadot/util'
import { DockAPI } from '@docknetwork/sdk'
import { parseIdentity } from './utils.js';
import { ApiHandler } from './lib/ApiHandler.js';
import express from 'express';
const port = 3000;

// collect usage stats into prometheus
const metrics = true
var counters = { kusama: {}, polkadot: {}, dock: {} }
function count(chain, fn) {
  console.debug('count()', chain, fn)
  if (!metrics) return
  if (counters[chain][fn]) { counters[chain][fn]++ } else { counters[chain][fn] = 1 }
}
// import client from 'prom-client';
// new client.Counter({
//   name: 'metric_name',
//   help: 'metric_help',
//   async collect () {
//     this.set(counters)
//   }
// });
// counter.inc(); // Increment by 1
// counter.inc(10); // Increment by 10

const wsUrl = {
  //polkadot: 'ws://localhost:30325',
  polkadot: 'wss://rpc.ibp.network/polkadot',
  kusama: 'ws://localhost:40425',
  dock: 'wss://mainnet-node.dock.io',
};

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

(async () => {

  const wsProviderKusama = new WsProvider(wsUrl.kusama)
  const wsProviderPolkadot = new WsProvider(wsUrl.polkadot)
  const kapi = await ApiPromise.create({ provider: wsProviderKusama, noInitWarn: true, throwOnConnect: false })
  const papi = await ApiPromise.create({ provider: wsProviderPolkadot, noInitWarn: true, throwOnConnect: false })
  const dock = new DockAPI()
  const dapi = await dock.init({ address: wsUrl.dock })
  const api = {
    kusama: kapi,
    polkadot: papi,
    dock: dapi
  }

  const kusamaHandler = new ApiHandler(wsUrl.kusama)
  const polkadotHandler = new ApiHandler(wsUrl.polkadot)
  const dockHandler = new ApiHandler(wsUrl.dock)
  const handlers = {
    kusama: kusamaHandler,
    polkadot: polkadotHandler,
    dock: dockHandler
  }

  const app = express()

  // enable /post with json body
  app.use(express.json());

  // log all routes!
  app.use((req, res, next) => {
    console.debug(`=> ${req.originalUrl}`)
    if (req.params) console.debug(`   => ${JSON.stringify(req.params)}`)
    // if (req.body)   console.debug(`   => ${JSON.stringify(req.body)}`)
    next()
  })

  app.get('/', (req, res) => {
    res.send('hello from dotsama rest api')
  })

  // prometheus metrics
  app.get('/:chain/metrics', (req, res) => {
    const chain = req.params.chain
    const PREFIX = `dotsama_rest_api`
    var items = []  
    Object.keys(counters[chain]).forEach((key) => {
      // items.push(`${PREFIX}_updated_at{stash="${stash}"} ${this.updatedAt.valueOf()}`)
      items.push(`${PREFIX}_count{chain="${chain}", function="${key}"} ${counters[chain][key]}`)
    })
    const result = items.join("\n")
    counters[chain] = {}
    res.header({'content-type':'text/plain; charset=utf-8'})
      .send(result)
  })

  //            api.registry
  app.get('/:chain/registry/getChainProperties', async(req, res, next) => {
    const chain = req.params.chain
    count(chain, '/registry/getChainProperties')
    console.debug(chain, '/api/registry/getChainProperties')
    try {
      // const chain = req.params.chain
      const chainProperties = await api[chain].registry.getChainProperties()
      res.json({ chainProperties })
    } catch (err) { next(err) }
  })

  //            api.derive.staking.accounts(ids)
  app.post('/:chain/derive/staking/accounts', async(req, res, next) => {
    const chain = req.params.chain
    count(chain, '/derive/staking/accounts')
    console.debug(chain, '/derive/staking/accounts')
    try {
      // const chain = req.params.chain
      const ids = req.body?.ids || []
      const accounts = await api[chain].derive.staking.accounts(ids)
      res.json({ accounts })
    } catch (err) { next(err) }
  })

  //           api.query.balances
  app.get('/:chain/query/balances/:method', async (req, res) => {
    let { chain, method } = req.params
    count(chain, `/query/balances/${method}`)
    let params = req.query
    let answer = await handlers[chain].balances(method, params)
    res.json(answer)
  })

  //           api.query.convictionVoting
  app.get('/:chain/query/convictionVoting/:method', async (req, res) => {
    let { chain, method } = req.params
    let params = req.query
    let answer = await handlers[chain].convictionVoting(method, params)
    res.json(answer)
  })

  //           api.query.democracy
  app.get('/:chain/query/democracy/:method', async (req, res) => {
    let { chain, method } = req.params
    let params = req.query
    let answer = await handlers[chain].democracy(method, params)
    res.json(answer)
  })

  //            api.query.identity.identityOf.multi(ids)
  app.post('/:chain/query/identity/identityOf', async(req, res, next) => {
    try {
      const chain = req.params.chain
      count(chain, '/query/identity/identityOf')
      const id = req.body?.id || null
      const ids = req.body?.ids || []
      if (id) {
        const identity = await api[chain].query.identity.identityOf(id)
        res.json({ identity: parseIdentity(identity) })
      } else {
        const identities = await api[chain].query.identity.identityOf.multi(ids)
        res.json({ identities: identities.map(id => parseIdentity(id)) })
      }
    } catch (err) { next(err) }
  })

  //           api.query.nominationPools
  app.get('/:chain/query/nominationPools/:method', async (req, res) => {
    let { chain, method } = req.params
    count(chain, `/query/nominationPools/${method}`)
    let params = req.query
    let answer = await handlers[chain].nominationPools(method, params)
    res.json(answer)
  })

  //            api.query.referenda
  app.get('/:chain/query/referenda/:method', async (req, res) => {
    let { chain, method } = req.params
    count(chain, `/query/nominationPools/${method}`)
    let params = req.query
    let answer = await handlers[chain].referenda(method, params)
    res.json(answer)
  })

  //           api.query.session.validators()
  app.get('/:chain/query/session/validators', async (req, res, next) => {
    try {
      const chain = req.params.chain
      count(chain, '/query/session/validators')
      const keys = await api[chain].query.session.validators()
      // console.log(keys)
      // const ids = keys.map(({ args: [stash] }) => stash.toJSON())
      var ids = keys.map(k => k.toString())
      // keys.forEach(key => {
      //   console.log(key.toString())
      // })
      // console.log(ids)
      res.json(ids)
    } catch (err) { next(err) }
  })

  //           api.query.staking.activeEra()
  app.get('/:chain/query/staking/activeEra', async (req, res, next) => {
    try {
      const chain = req.params.chain
      count(chain, '/query/staking/activeEra')
      const activeEra = await api[chain].query.staking.activeEra()
      res.json({ activeEra: activeEra.toJSON() })
    } catch (err) { next(err) }
  })
  //           api.query.staking.currentEra()
  app.get('/:chain/query/staking/currentEra', async (req, res, next) => {
    try {
      const chain = req.params.chain
      count(chain, '/query/staking/currentEra')
      const currentEra = await api[chain].query.staking.currentEra()
      res.json({ currentEra })
    } catch (err) { next(err) }
  })
  //           api.query.staking.erasStakers.entries(activeEra.index)
  app.get('/:chain/query/staking/erasStakers', async (req, res, next) => {
    try {
      const chain = req.params.chain
      count(chain, '/query/staking/eraStakers')
      const index = req.query.index || 0
      const entries = await api[chain].query.staking.erasStakers.entries(index)
      var list = []
      asyncForEach(entries, ([key, exposure]) => {
        // console.log('key arguments:', key.args.map((k) => k.toHuman()))
        // console.log('     exposure:', exposure.toHuman())
        var exp = exposure.toJSON()
        var [era, stash] = key.args.map((k) => k.toHuman())
        exp.era = parseInt(era.replace(',',''))
        exp.total = parseInt(exp.total, 16)
        exp.stash = stash
        exp.chain = chain
        list.push(exp)
      })
      res.json({ erasStakers: list })
    } catch (err) { next(err) }
  })
  //           api.query.staking.nominators.entries
  app.get('/:chain/query/staking/nominators', async (req, res, next) => {
    try {
      const chain = req.params.chain
      count(chain, '/query/staking/nominators')
      const nominators = await api[chain].query.staking.nominators.entries();
      const list = nominators.map(([address]) => ""+address.toHuman()[0]);
      res.json({ nominators: list })
    } catch (err) { next(err) }
  })
  //           api.query.staking.validators
  app.get('/:chain/query/staking/validators', async (req, res, next) => {
    try {
      const chain = req.params.chain
      count(chain, '/query/staking/validators')
      const validators = await api[chain].query.staking.validators.entries();
      // const list = validators.map(([address]) => ""+address.toHuman()[0]);
      res.json({ validators: validators.map(([key, prefs]) => {
        return {
          stash: key.toHuman()[0],
          prefs: prefs.toJSON()
        }
      } ) })
    } catch (err) { next(err) }
  })
  //           api.query.staking.unappliedSlashes
  app.get('/:chain/query/staking/unappliedSlashes', async (req, res, next) => {
    try {
      const chain = req.params.chain
      count(chain, '/query/staking/unappliedSlashes')
      const unappliedSlashes = await api[chain].query.staking.unappliedSlashes.entries();      
      res.json({
        unappliedSlashes: unappliedSlashes.map(([era, slashes]) => {
          return {
            era: String(era.toHuman()).replace(',', ''),
            slashes: slashes.toJSON()
          }
        }) 
      })
    } catch (err) { next(err) }
  })

  // TODO move this to the apiHandler?
  //           api.query.system.account
  app.get('/:chain/query/system/account/:accountId', async(req, res, next) => {
    const { chain, accountId } = req.params
    count(chain, '/query/system/account')
    try {
      const account = await api[chain].query.system.account(accountId)
      res.json(account)
    } catch (err) { next(err) }
  })

  //           api.query.system.account.multi
  app.get('/:chain/query/system/accountMulti', async(req, res, next) => {
    const { chain } = req.params
    count(chain, '/query/system/accountMulti')
    try {
      var ids = req.query.ids || [] // force a single id into array
      if(!Array.isArray(ids)) ids = [ids]
      console.debug('ids', ids)
      const accounts = await api[chain].query.system.account.multi(ids)
      res.json(accounts)
    } catch (err) { next(err) }
  })

  //           api.rpc.system.properties
  app.get('/:chain/rpc/system/properties', async(req, res, next) => {
    const chain = req.params.chain
    count(chain, '/rpc/system/properties')
    try {
      const props = await api[chain].rpc.system.properties()
      res.json(props)
    } catch (err) { next(err) }
  })

  // catch all errors!
  app.use((err, req, res, next) => {
    console.log('ERROR!!')
    if (err) {
      console.error(err.stack)
      res.status(500).send('Something broke!')
    } else {
      next()
    }
  })

  app.listen(port, () =>  {
    console.log('listening on '+ port)
  })

})()
