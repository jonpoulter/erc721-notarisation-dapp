# erc721-notarisation-dapp

Example Notarization Dapp using Ethereum ERC721 smart contract.

## Getting Started

### Prerequisites

- Chrome Browser

- Installing node and NPM is relatively straightforward using the installer package available from the [Node.js web site](https://nodejs.org/en/]) 

- [Install http-server globally](https://www.npmjs.com/package/http-server)

- [Install metamask chrome plugin](https://metamask.io/)

### Configuring your project

- Use NPM to install project dependencies
- Execute following command under `smart-contracts` folder

```
npm install
```

## Running Dapp

### Rinkeby Network

The smart contract is already deployed on Ethereum's Rinkeby Network.  The index.html is configured to use the address and ABI for this [smart-contract](https://rinkeby.etherscan.io/address/0x615e86ad5d77844821a92615bc9fa9b6d56372bd).  The contract address and [transaction hash](https://rinkeby.etherscan.io/tx/0xd56e73a714837ff923365ecb48008c4d9e74c97a01742d223dae4a660d2108fa) are shown below along with a [transaction hash](https://rinkeby.etherscan.io/tx/0xd502af46aa5788ad02e3661a58a5459a5e912c27b0973c5efe0913337ae6a29d) for the first `createStar()` invocation.

```
contract address: 0x615e86ad5d77844821a92615bc9fa9b6d56372bd
contract tx hash: 0xd56e73a714837ff923365ecb48008c4d9e74c97a01742d223dae4a660d2108fa

createStar: 0xd502af46aa5788ad02e3661a58a5459a5e912c27b0973c5efe0913337ae6a29d
```

- Execute following command under the root folder containing index.html file.  Ensure no other process is using port 8080 otherwise configure http-server to bind to an alternative port.

```
http-server [-p <port_number>]
```

### Local Ganache 

The smart contract can be deployed to a local running blockchain by creating an appropriate `truffle.js` configuration file inside the `smart-contracts` folder and executing the `truffle migrate` command.  The returned contract address must be configured inside the `index.html` file.  This is located near the bottom of the file with the comment `//local ganache contract address` 

The configuration below shows how to configure a local ganache node inside your `truffle.js` (mac) or `truffle-config.js` (windows) file:

```

module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // to customize your Truffle configuration!
  networks: {
    development: {
      host: "localhost",
      port: 7545,
      network_id: "*",  //Match any network
      gas:4712388
    }
  }
};

```


## Dapp Functionality

Navigate to `localhost:<port>` where `<port>` defaults to `8080`

On page load the Dapp will retrieve all star token ids associated with your default account and populate the 'My Stars' dropdown list.  

Click 'Get Star Info' will retrieve the associated Star Infornation stored within the smart contract.

New stars can be claimed by entering the requested star information in the form and clicking 'Claim Star'.  If the star has not already been claimed then the new star token id will be added to your 'My Stars' dropdown.


## Executing Smart Contract from Truffle Console

A new instance of the smart contract can be deployed and invoked on a test network as well as local ganache using truffle framework.

### Rinkeby Network

### Pre-requisites

- [infrura endpoint](https://infura.io/)

A new instance of the smart-contract can be deployed and invoked on rinkeby network using truffle.  This will require setting up a rinkeby configuration entry in your `truffle.js` (mac) or `truffle-config.js` (windows).  An example configuration is shown below:

```
const HDWalletProvider = require("truffle-hdwallet-provider");

module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // to customize your Truffle configuration!
  networks: {
    development: {
      host: "localhost",
      //ganache-cli port: 8545,
      port: 7545,
      network_id: "*",  //Match any network
      gas:4712388
    },
    rinkeby: {
      provider: function() {
        return new HDWalletProvider('<your_meta_mask_mnemonic', '<infura_endpoint_url>')
      },
      network_id: '4',
      gas: 4712388,
      gasPrice: 10000000000
    }
  }
};

```

The example below demonstrates deploying to rinkeby, connecting to rinkeby network via truffle console and interacting with the smartcontract by creating a new star and then putting it up for sale.

```
>truffle migrate --reset --network rinkeby

>truffle console --network rinkeby

truffle(rinkeby)>var st; StarNotary.deployed().then(function(deployed) {st = deployed})

truffle(rinkeby>st.createStar('jp star', '123', '456', '789', 'this is the first star to notarize!').then(function(tx){return st.putStarUpForSale(tx.logs[0].args.tokenId, 1)})

```



## Tests

### Prerequisites

- [install truffle test framework](https://truffleframework.com/truffle)

```
npm install -g truffle
```

- [install ganache and run ganache](https://truffleframework.com/ganache)


### Running Smart Contract Tests

- Execute following command under `smart-contracts` folder to run tests

```
truffle test
```

Since openzeppelin has been used to provide ERC721 functionality - tests are limited to ensuring StarNotary Smart Contract functions behave correctly and interact with openzeppelin's ERC721 related functions in a appropriate manner to ensure correct state transitions.

## Known Issues

- metamask never invokes callback when an error occurs due to star already been claimed.  This works fine when using local ganache environment.

- duplicate `Transfer` events are fired when claiming more than 1 star in any particular session.  Defensive coding has been put in place to prevent the  side effect of creating duplicate tokenIds in the "my stars" dropdown.

