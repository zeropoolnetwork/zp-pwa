# ZeroPool PWA

Angular based progressive web app to perform a truly private transaction on the Ethereum.
ZeroPool it self is a Rollup for publishing enctypted transaction.

You can try out it live:
- http://app.zeropool.network/
- https://testnet.app.zeropool.network/

App communicates with relayer and smart contracts deployed on two ethereum networks:
- Ethereum mainnet
- Gas chain (that could be any ethereum network) 

## Current statate:
At the moment following features are implemented:
- [x] Creation of new account on Baby JubJub elliptic curve
- [x] Deposits/withdrawals to/from main chain
- [x] Private transfets of ETH beetwen ZeroPool accounts
- [x] Private gas deposits on gas chain as payment for relay for block publishing
- [x] Integration with desktop metamask

## Change set for the upcoing release:
- [ ] ERC20 Supprot on UI
- [ ] Build/Version info in footer
- [ ] Settings / export mnemonic
- [ ] Settings / About page with a link to smart contract and relayer
- [ ] Withdraw to any address, not only to current selected on metamask
- [ ] More details in transaction history, links to etherscan 

## Technical debt:
- [ ] Introduce prope state managment, think on Akita at the moment
- [ ] OnPush change detection strategy for history and some other places
- [ ] Update from Angular 9.0.3 -> 9.0.6

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.
