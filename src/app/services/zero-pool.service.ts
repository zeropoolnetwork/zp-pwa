import { Injectable } from '@angular/core';
import { CircomeLoaderService } from './circome-loader.service';
import { GetBalanceProgressNotification, HistoryItem, HistoryState, MyUtxoState, stringifyUtxoState, ZeroPoolNetwork } from 'zeropool-lib';
import { concatMap, filter, map, shareReplay, switchMap, tap } from 'rxjs/operators';
import { AccountService, IAccount } from './account.service';
import { environment } from '../../environments/environment';
import { combineLatest, interval, Observable, of, Subject } from 'rxjs';
import { Web3ProviderService } from './web3.provider.service';
import { StateStorageService } from './state.storage.service';
import { fromPromise } from 'rxjs/internal-compatibility';
import { RelayerApiService } from './relayer.api.service';

export interface ZpBalance {
  [key: string]: number;
}

@Injectable({
  providedIn: 'root'
})
export class ZeroPoolService {

  public zp: ZeroPoolNetwork;

  public zpGasBalance$: Observable<number>;

  public zpBalance: ZpBalance;
  public zpHistory: HistoryItem[];

  private balanceProgressNotificator: Subject<GetBalanceProgressNotification> = new Subject();
  public balanceProgressNotificator$: Observable<GetBalanceProgressNotification> =
    this.balanceProgressNotificator.asObservable();

  private zpUpdatesSubject = new Subject<boolean>();
  public zpUpdates$: Observable<boolean> = this.zpUpdatesSubject.asObservable();


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
      filter((isReady: boolean) => isReady),
    );

    const updateStates$ = (
      zp: ZeroPoolNetwork,
      balanceProgress?: Subject<GetBalanceProgressNotification>,
    ): Observable<boolean> => {

      return combineLatest(
        [
          fromPromise(zp.getBalance()),
          fromPromise(zp.utxoHistory())
        ]
      ).pipe(
        tap((x) => {
          const [balances, history]: [ZpBalance, HistoryState] = x;
          this.zpBalance = balances;
          this.zpHistory = history.items;
        }),
        map(() => {
          return true;
        })
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
          this.stateStorageService.utxoState = stringifyUtxoState(utxoState);
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
          this.zpUpdatesSubject.next(true);
        }),
      );
    };

    const zp$ = combineLatest([circomLoaded$, web3Loaded$, this.accountService.account$]).pipe(
      map((x) => {
        const [ok1, ok2, account]: [boolean, boolean, IAccount] = x;

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

        updateStates$(zp, this.balanceProgressNotificator).subscribe(() => {
          pushUpdates$(zp).subscribe();
        });

        this.zp = zp;
        return zp$;
      }),
      shareReplay(),
    );

    zp$.subscribe();

    this.zpGasBalance$ = zp$.pipe(
      switchMap(
        (zp: ZeroPoolNetwork) => {
          return of(0.025);
        }
      ),
      shareReplay()
    );

  }


}

