import { Injectable } from '@angular/core';
import { CircomeLoaderService } from './circome-loader.service';
import { HistoryItem, HistoryState, MyUtxoState, normalizeUtxoState, ZeroPoolNetwork } from 'zeropool-lib';
import { filter, map, switchMap, tap } from 'rxjs/operators';
import { AccountService } from './account.service';
import { environment } from '../environments/environment';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { Web3ProviderService } from './web3.provider.service';
import { StateStorageService } from './state.storage.service';

export interface ZpBalance { [key: string]: number; }

@Injectable({
  providedIn: 'root'
})
export class ZeroPoolService {

  activeZpNetwork$: Observable<ZeroPoolNetwork>;

  zpBalance$: Observable<ZpBalance>;
  zpHistory$: Observable<HistoryItem[]>;

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
        return zp;
      }),
    );

    this.zpHistory$ = this.activeZpNetwork$.pipe(
      switchMap( (zpn: ZeroPoolNetwork) => {
        return zpn.zpHistoryState$;
      }),
      tap( (historyState: HistoryState) => {
        // Side effect - save to storage
        this.stateStorageService.historyState = historyState;
      }),
      map( (historyState: HistoryState) => {
        return historyState.items;
      })
    );

    this.activeZpNetwork$.pipe(
      switchMap( (zpn: ZeroPoolNetwork) => {
        return zpn.state$; // MerkleTree etc...
      }),
      tap((utxoState: MyUtxoState<bigint>) => {
        this.stateStorageService.utxoState = normalizeUtxoState(utxoState);
      })
    ).subscribe(); // Infinite subscribe

  }
}
