import { Component } from '@angular/core';
import { environment } from '../../environments/environment';
import { interval } from 'rxjs';
import { filter, map, take, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { Web3ProviderService } from '../services/web3.provider.service';


function networkId2Name(chainIdHex: string): string {
  // 0: Olympic, Ethereum public pre-release PoW testnet
  // 1: Frontier, Homestead, Metropolis, the Ethereum public PoW main network
  // 1: Classic, the (un)forked public Ethereum Classic PoW main network, chain ID 61
  // 1: Expanse, an alternative Ethereum implementation, chain ID 2
  // 2: Morden Classic, the public Ethereum Classic PoW testnet
  // 3: Ropsten, the public cross-client Ethereum PoW testnet
  // 4: Rinkeby, the public Geth-only PoA testnet
  // 5: Goerli, the public cross-client PoA testnet
  // 6: Kotti Classic, the public cross-client PoA testnet for Classic
  // 8: Ubiq, the public Gubiq main network with flux difficulty chain ID 8
  // 10: Quorum, the JP Morgan network
  // 42: Kovan, the public Parity-only PoA testnet
  // 60: GoChain, the GoChain networks mainnet
  // 77: Sokol, the public POA Network testnet
  // 99: Core, the public POA Network main network
  // 100: xDai, the public MakerDAO/POA Network main network
  // 31337: GoChain testnet, the GoChain networks public testnet
  // 401697: Tobalaba, the public Energy Web Foundation testnet
  // 7762959: Musicoin, the music blockchain
  // 61717561: Aquachain, ASIC resistant chain
  const mapping = {
    '0x1': 'Mainnet',
    '0x3': 'Ropsten',
    '0x4': 'Rinkeby',
    '0x2a': 'Kovan',
    '0x2A': 'Kovan',
  };

  return mapping[chainIdHex] || chainIdHex;
}


@Component({
  selector: 'app-select-network',
  templateUrl: './select-network.component.html',
  styleUrls: ['./select-network.component.scss']
})
export class SelectNetworkComponent {
  networkName: string;

  constructor(router: Router, web3Service: Web3ProviderService) {
    this.networkName = networkId2Name(environment.chainId);
    interval(500).pipe(
      map( () => {
        return web3Service.isCorrectNetworkSelected();
      }),
      filter((isOk) => isOk),
      take(1),
      tap( () => {
        router.navigate(['/main']);
      })
    ).subscribe()
  }


}
