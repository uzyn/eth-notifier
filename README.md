# ETH Notifier

An Ethereum smart contract that delivers notification on call.

Callable by any external contracts.

Contract on main chain: _(TBA)_


## How to run

1. Run a local Ethereum node with JSON-RPC listening at port 8545 _(default)_. [testrpc](https://github.com/ethereumjs/testrpc) would be the most straight-forward method.

  ```bash
  # Using testrpc (recommended)
  testrpc

  # If you are running Geth, 
  # make sure to run in testnet or private net and enable rpc
  geth --testnet --rpc
  ```

1. Install dependencies

  ```bash
  npm install
  ```

1. Generate server contracts helper

  ```bash
  npm run build-server

  # or, with watch
  npm run build-server -- --watch
  ```

1. Run server

  ```bash
  node server/
  ```

### User interface (web-based app)

**There are no web-based UI yet**

1. Start the dev server, code and enjoy! Browser should automatically refresh if you make any changes to the code.

  ```bash
  npm start
  ```

  Load [http://localhost:8080/](http://localhost:8080/) on your web browser.

1. For deployment, run `npm build` and upload `build/` to your server.

