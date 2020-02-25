import { Injectable } from '@angular/core';
import { CircomeLoaderService } from './circome-loader.service';
import { fw, HistoryItem, HistoryState, MyUtxoState, normalizeUtxoState, ZeroPoolNetwork } from 'zeropool-lib';
import { filter, map, switchMap, tap } from 'rxjs/operators';
import { AccountService } from './account.service';
import { environment } from '../environments/environment';
import { combineLatest, interval, Observable } from 'rxjs';
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

  public zp$: Promise<ZeroPoolNetwork>;
  public zpBalance: ZpBalance;
  public zpHistory: HistoryItem[];

  public zpUpdates$: Observable<boolean> = interval(5000).pipe(
    switchMap(() => {
      return fromPromise(this.zp$);
    }),
    switchMap((zp) => {
      return combineLatest(
        [
          fromPromise(zp.getBalance()),
          fromPromise(zp.utxoHistory())
        ]
      );
    }),
    tap(([balances, history]) => {
      this.zpBalance = balances;
      this.zpHistory = history.items.slice(0, 3);
    }),
    map(() => {
      return true;
    }));

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

    this.zpUpdates$.subscribe();

  }

}

