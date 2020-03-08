// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  chainId: '0xNaN',
  contractAddress: '0x0Aa156F7d2e4651308142ac3449AF4c74ddA57b1',
  sideChainAddress: '0xB5F25B9ff1E9C911265b885c8d3AaB5360551872',
  sideChainRpc: 'http://127.0.0.1:8545',
  relayerUrl: 'http://127.0.0.1:3000',
  // relayerUrl: 'https://testnet.relayer.zeropool.network',
  ethToken: '0x0000000000000000000000000000000000000000',
  relayerFee: 320 * (10 ** 9)
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
