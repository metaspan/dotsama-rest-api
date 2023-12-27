import { ApiPromise, WsProvider } from '@polkadot/api';
import { hexToString } from '@polkadot/util'
// import { parseIdentity } from './utils.js.js';

class ApiHandler {

  url = undefined
  chain = undefined
  provider = undefined
  api = undefined

  constructor(url='') {
    this.url = url
    this.setup()
  }

  async setup () {
    const provider = new WsProvider(this.url)
    const api = await ApiPromise.create({ provider })
    await api.isReady
    this.provider = provider
    this.api = api
  }

  // api.query.<module>.<method>
  async balances (method, params) {
    console.debug('balances()', method, params)
    const { accountId, at } = params
    var api = this.api
    if (at) {
      const atHash = await this.api.rpc.chain.getBlockHash(at)
      api = await this.api.at(atHash)
    }
    var ret
    try {
      switch (method) {
        case 'account':
          ret = await api.query.balances.account(accountId)
          console.debug(ret)
          ret = { account: ret.toJSON() }
          break
        case 'freezes':
          ret = await api.query.balances.freezes(accountId)
          ret = { freezes: ret.toJSON() }
          break
        case 'holds':
          ret = await api.query.balances.holds(accountId)
          ret = { holds: ret.toJSON() }
          break
        case 'locks':
          ret = await api.query.balances.locks(accountId)
          ret = { locks: ret.toJSON() }
          break
        case 'reserves':
          ret = await api.query.balances.reserves(accountId)
          ret = { reserves: ret.toJSON() }
          break
        case 'totalIssuance':
          ret = await api.query.balances.totalIssuance()
          ret = { totalIssuance: ret.toJSON() }
          break
        default:

      }
    } catch (err) {
      ret = { error: true, message: JSON.parse(JSON.stringify(err)) }
    }
    return Promise.resolve(ret)
  }

  // https://polkadot.js.org/docs/substrate/storage#convictionvoting
  async convictionVoting (method, params) {
    var ret
    var accountId
    var id
    try {

      switch (method) {
        // classLocksFor(AccountId32): Vec<(u16,u128)>
        // interface: api.query.convictionVoting.classLocksFor
        // summary: The voting classes which have a non-zero lock requirement and the lock amounts which they require. The actual amount locked on behalf of this pallet should always be the maximum of this list.
        case 'classLocksFor':
          ({ accountId } = params)
          ret = await this.api.query.convictionVoting.classLocksFor(accountId)
          ret = { classLocksFor: ret.toJSON() }
          break
        // votingFor(AccountId32, u16): PalletConvictionVotingVoteVoting
        // interface: api.query.convictionVoting.votingFor
        // summary: All voting for a particular voter in a particular voting class. We store the balance for the number of votes that we have recorded.
        case 'votingFor':
          ({ accountId, id } = params)
          if (id) {
            ret = await this.api.query.convictionVoting.votingFor(accountId, id)
            ret = { votingFor: ret.toJSON() }
          } else {
            // 
            ret = { error: true, message: 'invalid id'}
          }
          break
        default:
          ret = { error: true, message: `method ${method} not implemented`}
      }
    } catch (err) {
      console.error(err)
      ret = { error: true, message: JSON.parse(JSON.stringify(err)) }
    }
    return Promise.resolve(ret)
  }

  // api.query.<module>.<method>
  async democracy (method, params) {
    try {
      var ret
      var id
      var hash
      var accountId
      switch (method) {

        // blacklist(H256): Option<(u32,Vec<AccountId32>)>
        // interface: api.query.democracy.blacklist
        // summary: A record of who vetoed what. Maps proposal hash to a possible existent block number (until when it may not be resubmitted) and who vetoed it.
        case 'blacklist':
          ({ hash } = params)
          ret = await this.api.query.democracy.blacklist(hash)
          ret = { blacklist: ret.toJSON() }
          break
        // cancellations(H256): bool
        // interface: api.query.democracy.cancellations
        // summary: Record of all proposals that have been subject to emergency cancellation.
        case 'cancellations':
          ({ hash } = params)
          ret = await this.api.query.democracy.cancellations(hash)
          ret = { cancellations: ret.toJSON() }
          break
        // depositOf(u32): Option<(Vec<AccountId32>,u128)>
        // interface: api.query.democracy.depositOf
        // summary: Those who have locked a deposit.
        // TWOX-NOTE: Safe, as increasing integer keys are safe.
        case 'depositOf':
          ({ accountId } = params)
          ret = await this.api.query.democracy.depositOf(accountId)
          ret = { depositOf: ret.toJSON() }
          break
        // lastTabledWasExternal(): bool
        // interface: api.query.democracy.lastTabledWasExternal
        // summary: True if the last referendum tabled was submitted externally. False if it was a public proposal.
        case 'lastTabledWasExternal':
          ret = await this.api.query.democracy.lastTabledWasExternal()
          ret = { lastTabledWasExternal: ret.toJSON() }
          break
        // lowestUnbaked(): u32
        // interface: api.query.democracy.lowestUnbaked
        // summary: The lowest referendum index representing an unbaked referendum. Equal to ReferendumCount if there isn't a unbaked referendum.
        case 'lowestUnbaked':
          ret = await this.api.query.democracy.lowestUnbaked()
          ret = { lowestUnbaked: ret.toJSON() }
          break
        // nextExternal(): Option<(FrameSupportPreimagesBounded,PalletDemocracyVoteThreshold)>
        // interface: api.query.democracy.nextExternal
        // summary: The referendum to be tabled whenever it would be valid to table an external proposal. This happens when a referendum needs to be tabled and one of two conditions are met:
        // LastTabledWasExternal is false; or
        // PublicProps is empty.
        case 'nextExternal':
          ret = await this.api.query.democracy.nextExternal()
          ret = { nextExternal: ret.toJSON() }
          break
        // publicPropCount(): u32
        // interface: api.query.democracy.publicPropCount
        // summary: The number of (public) proposals that have been made so far.
        case 'publicPropCount':
          ret = await this.api.query.democracy.publicPropCount()
          ret = { publicPropCount: ret.toJSON() }
          break
        // publicProps(): Vec<(u32,FrameSupportPreimagesBounded,AccountId32)>
        // interface: api.query.democracy.publicProps
        // summary: The public proposals. Unsorted. The second item is the proposal.
        case 'publicProps':
          ret = await this.api.query.democracy.publicProps()
          ret = { publicProps: ret.toJSON() }
          break
        // referendumCount(): u32
        // interface: api.query.democracy.referendumCount
        // summary: The next free referendum index, aka the number of referenda started so far.
        case 'referendumCount':
          ret = await this.api.query.democracy.referendumCount()
          ret = { referendumCount: ret.toJSON() }
          break
        // referendumInfoOf(u32): Option<PalletDemocracyReferendumInfo>
        // interface: api.query.democracy.referendumInfoOf
        // summary: Information concerning any given referendum.
        // TWOX-NOTE: SAFE as indexes are not under an attacker’s control.
        case 'referendumInfoOf':
          ret = await this.api.query.democracy.referendumInfoOf(params[0])
          ret = { referendumInfoOf: ret.toJSON() }
          break      
        // votingOf(AccountId32): PalletDemocracyVoteVoting
        // interface: api.query.democracy.votingOf
        // summary: All votes for a particular voter. We store the balance for the number of votes that we have recorded. The second item is the total amount of delegations, that will be added.
        // TWOX-NOTE: SAFE as AccountIds are crypto hashes anyway.
        case 'votingOf':
          ({ accountId } = params)
          ret = await this.api.query.democracy.votingOf(accountId)
          ret = { votingOf: ret.toJSON() }
          break      

        default:
          ret = { error: true, message: `method ${method} not implemented`}
      }
    } catch (err) {
      ret = { error: true, message: JSON.parse(JSON.stringify(err)) }
    }

    return Promise.resolve(ret)
  }

  async nominationPools (method, params={}) {
    console.debug('ApiHandler.nominationPools()', method, params)
    var ret
    try {
      var { id, pid=0, accountId, at } = params
      var api = this.api
      if (at) {
        const atHash = await this.api.rpc.chain.getBlockHash(at)
        api = await this.api.at(atHash)
      }
      
      switch (method) {
        case 'lastPoolId':
          var ret = await api.query.nominationPools.lastPoolId()
          ret = { lastPoolId: ret.toNumber() }
          break
        case 'bondedPools':
          const bondedPools = await api.query.nominationPools.bondedPools(pid)
          ret = { bondedPools: bondedPools.toJSON() }
          break
        case 'metadata':
          // count(chain, '/query/nominationPools/metadata')
          const name = await api.query.nominationPools.metadata(pid)
          ret = { metadata: hexToString(name.toString()) }
          break
        case 'poolMembersForAccount':
          ret = await api.query.nominationPools?.poolMembers(accountId)
          ret = { poolMembers: ret ? ret.toJSON(): {} }
          break
        case 'poolMembers':
          // count(chain, '/query/nominationPools/poolMembers')
          var entries = await api.query.nominationPools.poolMembers.entries()
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
          ret = { poolMembers: members }
          break
        case 'rewardPools':
          // count(chain, '/query/nominationPools/rewardPools')
          const rewardPools = await api.query.nominationPools.rewardPools(pid)
          ret = { rewardPools: rewardPools.toJSON() }
          break
        case 'subPoolsStorage':
          // count(chain, '/query/nominationPools/subPoolsStorage')
          const subPoolsStorage = await api.query.nominationPools.subPoolsStorage(pid)
          ret = { subPoolsStorage: subPoolsStorage.toJSON() }
          break
      }
    } catch (err) {
      console.error(err)
      ret = { error: true, message: err }
    }
    return Promise.resolve(ret)
  }

  async referenda (method, params={}) {
    console.debug('ApiHandler.referenda()', method, params)
    var ret
    try {
      var id
      switch (method) {

        // decidingCount(u16): u32
        // interface: api.query.referenda.decidingCount
        // summary: The number of referenda being decided currently.
        case 'decidingCount':
          ({ id } = params)
          ret = await this.api.query.referenda.decidingCount(id)
          ret = { decidingCount: ret.toJSON() }
          break
        // referendumCount(): u32
        // interface: api.query.referenda.referendumCount
        // summary: The next free referendum index, aka the number of referenda started so far.
        case 'referendumCount':
          ret = await this.api.query.referenda.referendumCount()
          ret = { referendumCount: ret.toJSON() }
          console.log('ret', ret)
          break
        // referendumInfoFor(u32): Option<PalletReferendaReferendumInfoConvictionVotingTally>
        // interface: api.query.referenda.referendumInfoFor
        // summary: Information concerning any given referendum.
        case 'referendumInfoFor':
          ({ id } = params)
          ret = await this.api.query.referenda.referendumInfoFor(id)
          ret = { referendumInfoFor: ret.toJSON() }
          break
        // trackQueue(u16): Vec<(u32,u128)>
        // interface: api.query.referenda.trackQueue
        // summary: The sorted list of referenda ready to be decided but not yet being decided, ordered by conviction-weighted approvals.
        // This should be empty if DecidingCount is less than TrackInfo::max_deciding.
        case 'trackQueue':
          ({ id } = params)
          ret = await this.api.query.referenda.trackQueue(id)
          ret = { trackQueue: ret.toJSON() }
          break
        default:
          ret = { error: true, message: `method ${method} not implemented`}
      }
    } catch (err) {
      console.error(err)
      ret = { error: true, message: err }
    }
    return Promise.resolve(ret)
  }

  // // api.query.<module>.<method>
  // async staking (method, params) {
  //   console.debug('staking()', method, params)
  //   const { accountId, blockNo } = params
  //   var ret
  //   try {
  //     switch (method) {
  //       case 'bonded':
  //         ret = await this.api.query.staking.bonded(accountId)
  //         console.debug(ret)
  //         ret = { bonded: ret.toJSON() }
  //         break
  //       default:
  //     }
  //   } catch(err) {
  //     ret = { error: true, message: JSON.parse(JSON.stringify(err)) }
  //   }
  // }

  // api.query.<module>.<method>
  async system (method, params) {
    console.debug('system()', method, params)
    const { accountId, blockNo } = params
    var ret
    try {
      switch (method) {
        case 'account':
          ret = await this.api.query.balances.account(accountId)
          console.debug(ret)
          ret = { account: ret.toJSON() }
          break
        case 'allExtrinsicsLen':
        case 'blockHash':
        case 'blockWeight':
        case 'digest':
        case 'eventCount':
        case 'events':
        case 'eventTopics':
        case 'executionPhase':
        case 'extrinsicCount':
        case 'extrinsicData':
        case 'lastRuntime':
        case 'number':
        case 'parentHash':
        case 'upgradedToTripleRefCount':
        case 'upgradedToU32RefCount':
        default:
      }
    } catch (err) {
      ret = { error: true, message: JSON.parse(JSON.stringify(err)) }
    }
    return Promise.resolve(ret)
  }

}

export {
  ApiHandler
}
