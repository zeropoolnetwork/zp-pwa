export const environment = {
  production: true,
  chainId: '0x4',
  contractAddress: '0x3Af56F0d68470A1c53c5f300e840FBf7D132729a',
  sideChainAddress: '0x64e0CCE64d5418462b3cD74da880e4d1D6f84aCe',
  sideChainRpc: 'https://kovan.infura.io/v3/a3f4d001c1fc4a359ea70dd27fd9cb51',
  // relayerUrl: 'http://127.0.0.1:3000',
  relayerUrl: 'https://dev.relayer.zeropool.network',
  ethToken: '0x0000000000000000000000000000000000000000',
  relayerFee: 320 * (10 ** 9),
  etherscanPrefix: 'https://rinkeby.etherscan.io/tx/',
  etherscanSideChainPrefix: 'https://kovan.etherscan.io/tx/'
};
