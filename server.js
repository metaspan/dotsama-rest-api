
import { ApiPromise, WsProvider } from '@polkadot/api';
import { hexToString } from '@polkadot/util'
import { parseIdentity } from './utils.js';
import express from 'express';
const port = 3000;

const wsUrl = {
  polkadot: 'ws://localhost:30325',
  kusama: 'ws://localhost:40425',
};

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

(async () => {

  const wsProviderKusama = new WsProvider(wsUrl.kusama);
  const wsProviderPolkadot = new WsProvider(wsUrl.polkadot);
  const kapi = await ApiPromise.create({ provider: wsProviderKusama })
  const papi = await ApiPromise.create({ provider: wsProviderPolkadot })
  const api = {
    kusama: kapi,
    polkadot: papi
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

  //           api.query.staking.currentEra()
  app.get('/:chain/query/staking/currentEra', async (req, res, next) => {
    try {
      const chain = req.params.chain
      const currentEra = await api[chain].query.staking.currentEra()
      res.json({ currentEra })
    } catch (err) { next(err) }
  })

  //            api.derive.staking.accounts(ids)
  app.post('/:chain/derive/staking/accounts', async(req, res, next) => {
    try {
      const chain = req.params.chain
      const ids = req.body?.ids || []
      const accounts = await api[chain].derive.staking.accounts(ids)
      res.json({ accounts })
    } catch (err) { next(err) }
  })

  //           api.rpc.system.properties
  app.get('/:chain/rpc/system/properties', async(req, res, next) => {
    try {
      const chain = req.params.chain
      const props = await api[chain].rpc.system.properties()
      res.json(props)
    } catch (err) { next(err) }
  })

  //            api.query.identity.identityOf.multi(ids)
  app.post('/:chain/query/identity/identityOf', async(req, res, next) => {
    try {
      const chain = req.params.chain
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

  //           api.query.nominationPools.lastPoolId()
  app.get('/:chain/query/nominationPools/lastPoolId', async (req, res, next) => {
    try {
      const chain = req.params.chain
      var lastId = await api[chain].query.nominationPools.lastPoolId()
      res.json({ lastPoolId: lastId.toNumber() })
    } catch (err) { next(err) }
  })
  //           api.query.nominationPools.bondedPools(pid)
  app.get('/:chain/query/nominationPools/bondedPools', async (req, res, next) => {
    try {
      const chain = req.params.chain
      const pid = req.query.id || 0
      const bondedPools = await api[chain].query.nominationPools.bondedPools(pid)
      res.json({ bondedPools: bondedPools.toJSON() })
    } catch (err) { next(err) }

  })
  //           api.query.nominationPools.metadata(pid)
  app.get('/:chain/query/nominationPools/metadata', async (req, res, next) => {
    try {
      const chain = req.params.chain
      const pid = req.query.id || 0
      const name = await api[chain].query.nominationPools.metadata(pid)
      res.json({ metadata: hexToString(name.toString()) })
    } catch (err) { next(err) }
  })
  //           api.query.nominationPools.poolMembers.entries()
  app.get('/:chain/query/nominationPools/poolMembers', async (req, res, next) => {
    try {
      const chain = req.params.chain
      var entries = await api[chain].query.nominationPools.poolMembers.entries()
      // console.log('num entries', entries.length)
      var members = entries.reduce((all, [{ args: [accountId] }, optMember]) => {
        if (optMember.isSome) {
          const member = optMember.unwrap();
          const poolId = member.poolId.toNumber() // toString();
          if (!all[poolId]) { all[poolId] = []; }
          all[poolId].push({
            accountId: accountId.toString(),
            points: member.points.toNumber()
            // member
          });
          // all[poolId].push(accountId.toString());
        }
        return all;
      }, {})
      res.json({ poolMambers: members })
    } catch (err) { next(err) }
  })
  //           api.query.nominationPools.rewardPools(pid)
  app.get('/:chain/query/nominationPools/rewardPools', async (req, res, next) => {
    try {
      const chain = req.params.chain
      const pid = req.query.id || 0
      const rewardPools = await api[chain].query.nominationPools.rewardPools(pid)
      res.json({ rewardPools: rewardPools.toJSON() })
    } catch (err) { next(err) }
  })
  //           api.query.nominationPools.subPoolsStorage(pid)
  app.get('/:chain/query/nominationPools/subPoolsStorage', async (req, res, next) => {
    try {
      const chain = req.params.chain
      const pid = req.query.id || 0
      const subPoolsStorage = await api[chain].query.nominationPools.subPoolsStorage(pid)
      res.json({ subPoolsStorage: subPoolsStorage.toJSON() })
    } catch (err) { next(err) }
  })


  //           api.query.session.validators()
  app.get('/:chain/query/session/validators', async (req, res, next) => {
    try {
      const chain = req.params.chain
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
      const activeEra = await api[chain].query.staking.activeEra()
      res.json({ activeEra: activeEra.toJSON() })
    } catch (err) { next(err) }
  })
  //           api.query.staking.erasStakers.entries(activeEra.index)
  app.get('/:chain/query/staking/erasStakers', async (req, res, next) => {
    try {
      const chain = req.params.chain
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
      const nominators = await api[chain].query.staking.nominators.entries();
      const list = nominators.map(([address]) => ""+address.toHuman()[0]);
      res.json({ nominators: list })
    } catch (err) { next(err) }
  })
  //           api.query.staking.validators
  app.get('/:chain/query/staking/validators', async (req, res, next) => {
    try {
      const chain = req.params.chain
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
