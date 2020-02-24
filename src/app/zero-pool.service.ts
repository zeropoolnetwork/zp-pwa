import { Injectable } from '@angular/core';
import { CircomeLoaderService } from './circome-loader.service';
import { ZeroPoolNetwork } from 'zeropool-lib';
import { filter, map } from 'rxjs/operators';
import { AccountService } from './account.service';
import { environment } from '../environments/environment';
import { combineLatest, Observable } from 'rxjs';
import { Web3ProviderService } from './web3.provider.service';
import { StateStorageService } from './state.storage.service';

@Injectable({
  providedIn: 'root'
})
export class ZeroPoolService {

  activeZpNetwork$: Observable<ZeroPoolNetwork>;

  constructor(
    private circomeSvc: CircomeLoaderService,
    private accountService: AccountService,
    private web3ProviderService: Web3ProviderService,
    private stateStorageService: StateStorageService
  ) {

    // const x: ZeroPoolNetwork = {} as any as ZeroPoolNetwork;

    // In order to get ethereum balance use:
    // activeZpNetwork.ZeroPool.web3Ethereum.getBalance('');

    const circomLoaded$ = this.circomeSvc.isReady$.pipe(
      filter((isReady) => isReady),
    );

    const web3Loaded$ = this.web3ProviderService.isReady$.pipe(
      filter((isReady) => isReady),
    );

    this.activeZpNetwork$ = combineLatest([circomLoaded$, web3Loaded$, this.accountService.account$]).pipe(
      map(([ok1, ok2, account]) => {

        const zp = new ZeroPoolNetwork(
          environment.contractAddress,
          this.web3ProviderService.web3Provider,
          account.zeropoolMnemonic,
          this.circomeSvc.circomeTxJson,
          this.circomeSvc.proverKey,
          this.stateStorageService.utxoState,
          this.stateStorageService.historyState
        );

        zp.zpHistoryState$.subscribe(historyState => {
          this.stateStorageService.historyState = historyState;
        });

        zp.state$.subscribe(utxoState => {
          this.stateStorageService.utxoState = utxoState;
        });

        // this.accountService.ethereumAddress = zp.ZeroPool.web3Ethereum.ethAddress;

        return zp;

      }),
    );
  }
}
