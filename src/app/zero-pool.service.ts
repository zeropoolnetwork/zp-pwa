import { Injectable } from '@angular/core';
import { CircomeLoaderService } from './circome-loader.service';
import { HistoryItem, HistoryState, MyUtxoState, normalizeUtxoState, ZeroPoolNetwork } from 'zeropool-lib';
import { concatMap, filter, map, tap } from 'rxjs/operators';
import { AccountService } from './account.service';
import { environment } from '../environments/environment';
import { combineLatest, interval, Observable, Subject } from 'rxjs';
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

  public zp: ZeroPoolNetwork;

  public zpBalance: ZpBalance;
  public zpHistory: HistoryItem[];

  private zpUpdates = new Subject<boolean>();
  public zpUpdates$: Observable<boolean> = this.zpUpdates.asObservable();

  constructor(
    private circomeSvc: CircomeLoaderService,
    private accountService: AccountService,
    private web3ProviderService: Web3ProviderService,
    private stateStorageService: StateStorageService
  ) {

    const circomLoaded$ = this.circomeSvc.isReady$.pipe(
      filter((isReady) => isReady),
    );

    const web3Loaded$ = this.web3ProviderService.isReady$.pipe(
      filter((isReady) => isReady),
    );

    const updateStates$ = (zp: ZeroPoolNetwork): Observable<boolean> => {
      return combineLatest(
        [
          fromPromise(zp.getBalance()),
          fromPromise(zp.utxoHistory())
        ]
      ).pipe(
        tap(([balances, history]) => {
          this.zpBalance = balances;
          this.zpHistory = history.items;
        }),
        map(() => {
          return true;
        })
      );
    };

    // todo: catch error
    const pushUpdates$ = (zp: ZeroPoolNetwork): Observable<any> => {
      return interval(5000).pipe(
        concatMap(() => {
          return updateStates$(zp);
        }),
        tap(() => {
          this.zpUpdates.next(true);
        }),
      );
    };

    const listenHistoryStateUpdates$ = (zp: ZeroPoolNetwork): Observable<any> => {
      return zp.zpHistoryState$.pipe(
        tap((historyState: HistoryState) => {
          this.stateStorageService.historyState = historyState;
        }),
      );
    };

    const listenUtxoStateUpdates$ = (zp: ZeroPoolNetwork): Observable<any> => {
      return zp.utxoState$.pipe(
        tap((utxoState: MyUtxoState<bigint>) => {
          this.stateStorageService.utxoState = normalizeUtxoState(utxoState);
        })
      );
    };

    combineLatest([circomLoaded$, web3Loaded$, this.accountService.account$]).pipe(
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

        listenHistoryStateUpdates$(zp).subscribe();
        listenUtxoStateUpdates$(zp).subscribe();

        pushUpdates$(zp).subscribe();

        this.zp = zp;
      })
    ).subscribe();

  }


}

