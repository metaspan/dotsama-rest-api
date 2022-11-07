import { hexToString } from '@polkadot/util'

export function parseIdentity (id) {
  const idj = id.toJSON()
  // console.debug('idj', idj)
  if (idj) {
    return {
      deposit: idj.deposit,
      info: {
        // additional...
        display: idj.info.display.raw ? hexToString(idj.info.display.raw) : '',
        email: idj.info.email.raw ? hexToString(idj.info.email.raw) : '',
        // image...
        legal: idj.info.legal.raw ? hexToString(idj.info.legal.raw) : '',
        riot: idj.info.riot.raw ? hexToString(idj.info.riot.raw) : '',
        twitter: idj.info.twitter.raw ? hexToString(idj.info.twitter.raw) : '',
        web: idj.info.web.raw ? hexToString(idj.info.web.raw) : ''
      },
      judgements: idj.judgements
    }
  } else {
    return null
  }
}
