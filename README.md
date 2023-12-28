# dotsama-rest-api
REST wrapper to polkadot.js API

<!--
# NOTE: This service is running docker on swarm1 / miner2
-->

```bash
docker compose build
docker compose up -d
```

# getting started

```bash
git clone https://github.com/metaspan/dotsama-rest-apidotsama-rest-api
cd dotsama-rest-api
npm install
cp .env.sample .env
# edit .env as required
# edit server.js, set PORT
node server.js
```

# TODO

- insert table of GET/POST calls

# other solutions

- https://github.com/paritytech/substrate-api-sidecar
