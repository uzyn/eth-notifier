# ETH Notifier

An Ethereum smart contract that delivers notification on call.

Callable by any external contracts.

Implements [IoT Standards v0.1 Draft](#details-comint-soon)


This repository contains 2 independent sets of code that powers:

1. Service provider Ethereum-HTTP bridge
    - Listens to relevant events on Ethereum blockchain
    - Relays the information via HTTP to service provider's API
    - Processes the refund to the caller after deducting the service fees

1. Client Ethereum-HTTP bridge
    - This is a helper to provide IoT devices to call Ethereum functions via HTTP without having to host full Ethereum node on the device.
    - For example, allowing Amazon Dash button or Flic.io button to make calls to ETH Notifier.
    - **Notice**: This is a proof of concept. Client bridge's security is not hardened in any way. If you are deploying it to the internet, make sure to restrict it or include some measures of security.

Both the bridges can be run on the same server or can be run on 2 separate servers.

## How to run (common for both)

1. Run a local Ethereum node with JSON-RPC listening at port 8545 _(default)_. [testrpc](https://github.com/ethereumjs/testrpc) would be the most straight-forward method.

    ```bash
    # Using testrpc (recommended)
    testrpc

    # testrpc -g 20000000000
    # to start testrpc with 0.02 szabo gas price

    # If you are running Geth, 
    # make sure to run in testnet or private net and enable rpc
    geth --testnet --rpc --rpccorsdomain "*"
    # Tip: Do not forget to unlock relevant wallets
    ```

1. Install dependencies

    ```bash
    npm install
    ```

### As a service provider

Service provider in this context is the one providing SMS notification service in exchange for Ether.

1. Configure as necessary to `config/local.js`, by overriding keys from `config/default.js`, especially the `server` section.

1. Run the server

    ```bash
    node server/
    # Tip: use PM2 for keep-alive
    ```

    Note: You may wish to redeploy the contracts by running:

    ```
    npm run redeploy
    ```

    (WIP. See [tips](#tips) for info on how to redeploy)


##### Web interface

Web interface is optional. You may run it either via `npm run web-dev` or by accessing static HTML files from `build/` directory.


### As a client Ethereum-HTTP bridge

1. Configure as necessary to `config/local.js`, by overriding keys from `config/default.js`, especially the `client` section.

1. Run the server

    ```bash
    node client/
    # Tip: use PM2 for keep-alive
    ```

    Note: You may wish to redeploy the contracts by running:

    ```
    npm run redeploy
    ```

    (WIP. See [tips](#tips) for info on how to redeploy)

##### Web interface

There are no web interface for client server at this point in time.


## Tips

1. Files at `script/` are one-off scripts to help during development and are not loaded anywhere. 

2. `redeploy` is still work-in-progress. In the mean time, to redeploy contracts, remove `deployedContracts` section from `webpack.config.contract.js` and run `npm build`.
