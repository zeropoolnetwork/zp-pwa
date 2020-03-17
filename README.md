# ZeroPool PWA

Angular based progressive web app to perform a truly private transaction on the Ethereum.
ZeroPool itself is a Rollup for publishing encrypted transactions.

You can try out it live:
- http://app.zeropool.network/
- https://testnet.app.zeropool.network/

The app communicates with relayer and smart contracts deployed on two ethereum networks:
- Ethereum mainnet
- Gas chain (that could be any ethereum network) 

## Current state:
At the moment, the following features are implemented:
- [x] Creation of a new account on Baby JubJub elliptic curve
- [x] Deposits/withdrawals to/from the main chain
- [x] Private transfers of ETH between ZeroPool accounts
- [x] Private gas deposits on the gas chain as payment for relay for block publishing
- [x] Integration with desktop Metamask

## Changeset for the upcoming release:
- [ ] ERC20 Support on UI
- [ ] Build/Version info in the footer
- [ ] Settings / export mnemonic
- [ ] Settings / About page with a link to smart contract and relayer
- [ ] Withdraw to any address, not only to currently selected on metamask
- [ ] More details in the transaction history, links to etherscan

## Technical debt:
- [ ] Introduce proper state management, think on Akita at the moment
- [ ] OnPush change detection strategy for history and some other places
- [ ] Update from Angular 9.0.3 -> 9.0.6

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.
