export const environment = {
  production: true,
  chainId: '0x4',
  contractAddress: '0x08734d27E29f82C31CC6C141f0b879E45D7398d0',
  sideChainAddress: '0x3af56f17caBdF0c5e882FE1377eE8B21Ea751A5A',
  sideChainRpc: 'https://kovan.infura.io/v3/a3f4d001c1fc4a359ea70dd27fd9cb51',
  // relayerUrl: 'http://127.0.0.1:3000',
  relayerUrl: 'https://testnet.relayer.zeropool.network',
  ethToken: '0x0000000000000000000000000000000000000000',
  relayerFee: 320 * (10 ** 9),
  etherscanPrefix: 'https://rinkeby.etherscan.io/tx/',
  etherscanSideChainPrefix: 'https://kovan.etherscan.io/tx/'
};
