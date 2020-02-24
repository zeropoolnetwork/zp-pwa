import { Injectable } from '@angular/core';
import { CircomeLoaderService } from './circome-loader.service';
import { HistoryState, MyUtxoState, normalizeUtxoState, ZeroPoolNetwork } from 'zeropool-lib';
import { filter, map, switchMap, tap } from 'rxjs/operators';
import { AccountService } from './account.service';
import { environment } from '../environments/environment';
import { combineLatest, Observable } from 'rxjs';
import { Web3ProviderService } from './web3.provider.service';
import { StateStorageService } from './state.storage.service';
import { fromPromise } from 'rxjs/internal-compatibility';

export interface ZpBalance {
  [key: string]: number;
}

@Injectable({
  providedIn: 'root'
})
export class ZeroPoolService {

  // todo: rewrite it!!!!!!!!!
  public zp$: Promise<ZeroPoolNetwork>;
  private zp: ZeroPoolNetwork;

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

    this.zp$ = combineLatest([circomLoaded$, web3Loaded$, this.accountService.account$]).pipe(
      map(([ok1, ok2, account]) => {
        return new ZeroPoolNetwork(
          environment.contractAddress,
          this.web3ProviderService.web3Provider,
          account.zeropoolMnemonic,
          this.circomeSvc.circomeTxJson,
          this.circomeSvc.proverKey,
          this.stateStorageService.utxoState,
          this.stateStorageService.historyState
        );
      })
    ).toPromise();

    fromPromise(this.zp$).pipe(
      switchMap((zpn: ZeroPoolNetwork) => {
        return zpn.zpHistoryState$;
      }),
      tap((historyState: HistoryState) => {
        // Side effect - save to storage
        this.stateStorageService.historyState = historyState;
      }),
    ).subscribe(); // Infinite subscribe

    fromPromise(this.zp$).pipe(
      switchMap((zpn: ZeroPoolNetwork) => {
        return zpn.utxoState$; // MerkleTree etc...
      }),
      tap((utxoState: MyUtxoState<bigint>) => {
        this.stateStorageService.utxoState = normalizeUtxoState(utxoState);
      })
    ).subscribe(); // Infinite subscribe

  }

}
