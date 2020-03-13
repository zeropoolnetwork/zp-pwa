export const environment = {
  production: true,
  chainId: '0x4',
  contractAddress: '0x82Fe66B01c443722Ec302E7B2517C83Bb1619cbd',
  sideChainAddress: '0x4bc1Bb2032Ffa8D9990380b48F58A595e2Ab26d7',
  sideChainRpc: 'https://kovan.infura.io/v3/a3f4d001c1fc4a359ea70dd27fd9cb51',
  // relayerUrl: 'http://127.0.0.1:3000',
  relayerUrl: 'https://dev.relayer.zeropool.network',
  ethToken: '0x0000000000000000000000000000000000000000',
  relayerFee: 320 * (10 ** 9),
  etherscanPrefix: 'https://rinkeby.etherscan.io/tx/',
  etherscanSideChainPrefix: 'https://kovan.etherscan.io/tx/'
};
