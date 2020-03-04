// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  chainId: '0x4',
  contractAddress: '0x9fC4d8178C31d4EecdF184aB51853bB88cabb859',
  sideChainAddress: '0x4CA54A3FaF2A98534Ad950433bc7bC0bEfB4d82a',
  sideChainRpc: 'https://kovan.infura.io/v3/a3f4d001c1fc4a359ea70dd27fd9cb51',
  // relayerUrl: 'http://127.0.0.1:3000',
  relayerUrl: 'https://testnet.relayer.zeropool.network',
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
