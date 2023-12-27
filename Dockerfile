FROM node:18-slim

COPY . /app

WORKDIR /app

RUN rm -rf node_modules && npm install

ENV POLKADOT_URL=wss://rpc.ibp.network/polkadot
ENV KUSAMA_URL=wss://rpc.ibp.network/kusama
ENV DOCK_URL=wss://mainnet-node.dock.io

EXPOSE 3000

CMD [ "npm", "start" ]
