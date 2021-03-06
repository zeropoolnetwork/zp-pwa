// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.


export const environment = {
  production: false,
  chainId: '0x4',
  contractAddress: '0x6B989220CFDeb3B4Aec4f904E5D293d3f3E98685',
  sideChainAddress: '0xE5CAd5F5f4021e2427462115251090B1196f9C1F',
  sideChainRpc: 'https://kovan.infura.io/v3/826fec4cbd954dfd89c714eabf4611c4',
  relayerUrl: 'http://127.0.0.1:3000',
  // relayerUrl: 'https://testnet.relayer.zeropool.network',
  ethToken: '0x0000000000000000000000000000000000000000',
  relayerFee: 320 * (10 ** 9),
  etherscanPrefix: 'https://rinkeby.etherscan.io/tx/',
  etherscanSideChainPrefix: 'https://kovan.etherscan.io/tx/'
};

export const environment2 = {
  production: false,
  chainId: '0x4',
  contractAddress: '0x33641D753c965E9f789C4f2E439C12DeF2fe21d7',
  sideChainAddress: '0x85d2f0F6BF0E80e5eCB4F840C10Df76120a5C4eC',
  sideChainRpc: 'https://kovan.infura.io/v3/826fec4cbd954dfd89c714eabf4611c4',
  relayerUrl: 'http://127.0.0.1:3000',
  // relayerUrl: 'https://testnet.relayer.zeropool.network',
  ethToken: '0x0000000000000000000000000000000000000000',
  relayerFee: 320 * (10 ** 9)
};

export const environment1 = {
  production: false,
  chainId: '0xNaN',
  contractAddress: '0x20656D3Aee9Cd3B4280840DE17EFE80d9487a948',
  sideChainAddress: '0x567a47E3AE32CBbe95ac4eE67F735Fec317662ab',
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
