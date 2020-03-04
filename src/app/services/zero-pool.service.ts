import { Injectable } from '@angular/core';
import { CircomLoaderService } from './circom-loader.service';
import {
  fw,
  GetBalanceProgressNotification,
  HistoryAndBalances,
  HistoryItem,
  HistoryState,
  MyUtxoState,
  PayNote,
  stringifyUtxoHistoryState,
  stringifyUtxoState,
  ZeroPoolNetwork
} from 'zeropool-lib';
import { concatMap, filter, map, shareReplay, tap } from 'rxjs/operators';
import { AccountService } from './account.service';
import { environment } from '../../environments/environment';
import { BehaviorSubject, combineLatest, interval, Observable, Subject } from 'rxjs';
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
  private isReady: Subject<boolean> = new BehaviorSubject<boolean>(false);
  public isReady$: Observable<boolean> = this.isReady.asObservable().pipe(
    shareReplay()
  );

  public zp: ZeroPoolNetwork;
  public zpGas: ZeroPoolNetwork;

  public ethBalance: number;
  public zpBalance: ZpBalance;
  public zpHistory: HistoryItem[];
  public activeWithdrawals: PayNote[];
  public currentBlockNumber: number;

  public zpGasBalance: number;

  public challengeExpiresBlocks = 10;

  private balanceProgressNotificator: Subject<GetBalanceProgressNotification> = new Subject();
  public balanceProgressNotificator$: Observable<GetBalanceProgressNotification> =
    this.balanceProgressNotificator.asObservable();

  private zpUpdatesSubject = new Subject<boolean>();
  public zpUpdates$: Observable<boolean> = this.zpUpdatesSubject.asObservable();

  constructor(
    private circomeSvc: CircomLoaderService,
    private accountService: AccountService,
    private web3ProviderService: Web3ProviderService,
    private stateStorageService: StateStorageService
  ) {

    // todo: challengeExpiresBlocks - this.zp.ZeroPool.getChallengeExpiresBlocks();
    // see: prepareWithdraw / prepareWithdraw-list components

    const circomLoaded$ = this.circomeSvc.isReady$.pipe(
      filter((isReady) => isReady),
    );

    const web3Loaded$ = this.web3ProviderService.isReady$.pipe(
      filter((isReady: boolean) => isReady),
    );

    const updateStates$ = (
      zp: ZeroPoolNetwork,
      zpGas: ZeroPoolNetwork,
      balanceProgress?: Subject<GetBalanceProgressNotification>,
    ): Observable<boolean> => {

      const getBalanceAndHistory$ = fromPromise(zp.getBalanceAndHistory());
      const getActiveWithdrawals$ = fromPromise(zp.getActiveWithdrawals());
      const getBlockNumber = fromPromise(zp.ZeroPool.web3Ethereum.getBlockNumber());
      const getGasBalance = fromPromise(zpGas.getBalance());
      const getEthBalance = fromPromise(
        // @ts-ignore todo: fix it
        zp.ZeroPool.web3Ethereum.getBalance(window.ethereum.selectedAddress)
      );

      return combineLatest(
        [
          getBalanceAndHistory$,
          getActiveWithdrawals$,
          getBlockNumber,
          getGasBalance,
          getEthBalance
        ]
      ).pipe(
        tap((x) => {
          const [
            balancesAndhistory,
            activeWithdrawals,
            blockNumber,
            gasBalance,
            ethBalance
          ]: [HistoryAndBalances, PayNote[], number, ZpBalance, string] = x;

          this.zpBalance = balancesAndhistory.balances;
          this.zpHistory = balancesAndhistory.historyItems;
          this.activeWithdrawals = activeWithdrawals;
          this.currentBlockNumber = blockNumber;

          this.zpGasBalance = gasBalance['0x0'] || 0;
          this.ethBalance = fw(ethBalance);

        }),
        map(() => {
          return true;
        })
      );
    };

    function listenHistoryStateUpdates$(zp: ZeroPoolNetwork, saveHistory: (val: HistoryState<string>) => void): Observable<any> {

      return zp.zpHistoryState$.pipe(
        tap((historyState: HistoryState<bigint>) => {
          // TODO: think on switchMap here
          const hexified = stringifyUtxoHistoryState(historyState);
          saveHistory(hexified);
        }),
      );

    }

    function listenUtxoStateUpdates$(zp: ZeroPoolNetwork, saveUtxo: (val: MyUtxoState<string>) => void): Observable<any> {

      return zp.utxoState$.pipe(
        tap((utxoState: MyUtxoState<bigint>) => {
          // TODO: think on switchMap here
          const hexified = stringifyUtxoState(utxoState);
          saveUtxo(hexified);
        })
      );

    }


    // todo: catch error
    const pushUpdates$ = (zp: ZeroPoolNetwork, gasZp: ZeroPoolNetwork): Observable<any> => {
      return interval(10000).pipe(
        concatMap(() => {
          return updateStates$(zp, gasZp);
        }),
        tap(() => {
          this.zpUpdatesSubject.next(true);
        }),
      );
    };

    combineLatest([
      circomLoaded$,
      web3Loaded$,
      this.accountService.account$,
      this.stateStorageService.getUtxoState(),
      this.stateStorageService.getHistoryState(),
      this.stateStorageService.getGasUtxoState(),
    ]).pipe(
      tap((x) => {

        const [
          ok1,
          ok2,
          account,
          utxoState,
          historyState,
          gasUtxoState,
        ] = x;

        const zp = new ZeroPoolNetwork(
          environment.contractAddress,
          this.web3ProviderService.web3Provider,
          account.zeropoolMnemonic,
          this.circomeSvc.circomeTxJson,
          this.circomeSvc.proverKey,
          utxoState,
          historyState
        );

        const gasWeb3Provider = this.web3ProviderService.getWeb3GasProvider();

        const zpGas = new ZeroPoolNetwork(
          environment.sideChainAddress,
          gasWeb3Provider,
          account.zeropoolMnemonic,
          this.circomeSvc.circomeTxJson,
          this.circomeSvc.proverKey,
          gasUtxoState,
        );

        listenHistoryStateUpdates$(zp, this.stateStorageService.saveHistory).subscribe();
        listenUtxoStateUpdates$(zp, this.stateStorageService.saveUtxo).subscribe();

        // listenHistoryStateUpdates$(zpGas, this.stateStorageService.saveGasHistory).subscribe();
        listenUtxoStateUpdates$(zpGas, this.stateStorageService.saveGasUtxo).subscribe();

        updateStates$(zp, zpGas, this.balanceProgressNotificator).pipe(
          tap(() => {
            this.isReady.next(true);
            this.zpUpdatesSubject.next(true);
          }),
        ).subscribe(() => {
          pushUpdates$(zp, zpGas).subscribe();
        });


        this.zp = zp;
        this.zpGas = zpGas;
      }),
    ).subscribe();

  }


}

