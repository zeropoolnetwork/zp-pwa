import { Injectable } from '@angular/core';
import { CircomLoaderService } from './circom-loader.service';
import {
  fw,
  GetBalanceProgressNotification,
  HistoryAndBalances,
  HistoryItem,
  HistoryState,
  IMerkleTree,
  MyUtxoState,
  PayNote,
  stringifyUtxoHistoryState,
  stringifyUtxoState,
  ZeroPoolNetwork
} from 'zeropool-lib';
import { concatMap, filter, map, mergeMap, shareReplay, tap, timeout } from 'rxjs/operators';
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
    shareReplay(1),
  );

  public start$: Observable<any>;

  public zp: ZeroPoolNetwork;
  public zpGas: ZeroPoolNetwork;

  public ethBalance: number;
  public zpBalance: ZpBalance;
  public zpHistory: HistoryItem[];
  public activeWithdrawals: PayNote[];
  public currentBlockNumber: number;

  public zpGasBalance: number;

  public challengeExpiresBlocks: number | string = '?';

  private balanceProgressNotificator: Subject<GetBalanceProgressNotification> = new Subject();
  public balanceProgressNotificator$: Observable<GetBalanceProgressNotification> =
    this.balanceProgressNotificator.asObservable();

  private zpUpdatesSubject = new Subject<boolean>();
  public zpUpdates$: Observable<boolean> = this.zpUpdatesSubject.asObservable();

  constructor(
    private circomService: CircomLoaderService,
    private accountService: AccountService,
    private web3ProviderService: Web3ProviderService,
    private stateStorageService: StateStorageService
  ) {

    // see: prepareWithdraw / prepareWithdraw-list components

    const circomLoaded$ = this.circomService.isReady$.pipe(
      filter((isReady) => isReady),
    );

    const web3Loaded$ = this.web3ProviderService.isReady$.pipe(
      filter((isReady: boolean) => isReady),
    );

    this.start$ = combineLatest([
      circomLoaded$,
      web3Loaded$,
      this.accountService.account$,
      this.stateStorageService.getUtxoState(),
      this.stateStorageService.getHistoryState(),
      this.stateStorageService.getGasUtxoState(),
    ]).pipe(
      mergeMap((x) => {

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
          this.circomService.circomeTxJson,
          this.circomService.proverKey,
          utxoState,
          historyState
        );

        const gasWeb3Provider = this.web3ProviderService.getWeb3GasProvider();

        const zpGas = new ZeroPoolNetwork(
          environment.sideChainAddress,
          gasWeb3Provider,
          account.zeropoolMnemonic,
          this.circomService.circomeTxJson,
          this.circomService.proverKey,
          gasUtxoState,
        );

        this.listenHistoryStateUpdates$(zp, this.stateStorageService.saveHistory).subscribe();
        this.listenUtxoStateUpdates$(zp, this.stateStorageService.saveUtxo).subscribe();

        this.listenUtxoStateUpdates$(zpGas, this.stateStorageService.saveGasUtxo).subscribe();

        this.zp = zp;
        this.zpGas = zpGas;

        if (this.accountService.isNewAccount()) {
          return this.lightUpdate(zp, zpGas).pipe(
            mergeMap(() => {
              return fromPromise(this.zp.ZeroPool.getChallengeExpiresBlocks());
            }),
            mergeMap((blocksNum) => {
              this.challengeExpiresBlocks = +blocksNum;
              this.isReady.next(true);
              this.zpUpdatesSubject.next(true);
              return this.pushUpdates$(zp, zpGas);
            }),
          );
        }

        return this.updateStates$(zp, zpGas, this.balanceProgressNotificator).pipe(
          mergeMap(() => {
            return fromPromise(this.zp.ZeroPool.getChallengeExpiresBlocks());
          }),
          mergeMap((blocksNum) => {
            this.challengeExpiresBlocks = +blocksNum;
            this.isReady.next(true);
            this.zpUpdatesSubject.next(true);
            return this.pushUpdates$(zp, zpGas);
          }),
        );

      }),
      shareReplay()
    );

  }

  private updateStates$(
    zp: ZeroPoolNetwork,
    zpGas: ZeroPoolNetwork,
    balanceProgress?: Subject<GetBalanceProgressNotification>,
  ): Observable<boolean> {

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
  }

  private lightUpdate(
    zp: ZeroPoolNetwork,
    zpGas: ZeroPoolNetwork,
  ): Observable<boolean> {

    const zpTree$ = zp.fetchMerkleTree();
    const zpGasTree$ = zpGas.fetchMerkleTree();

    // @ts-ignore todo: fix it
    const getEthBalance = zp.ZeroPool.web3Ethereum.getBalance(window.ethereum.selectedAddress);

    return combineLatest([
      fromPromise(zpTree$),
      fromPromise(zpGasTree$),
      fromPromise(getEthBalance)
    ]).pipe(
      tap(
        (x) => {
          const [
            zpTree,
            zpGasTree,
            ethBalance,
          ]: [IMerkleTree, IMerkleTree, string] = x;

          this.zpBalance = {'0x0': 0};
          this.zpHistory = [];
          this.activeWithdrawals = [];
          this.currentBlockNumber = 0;

          this.zpGasBalance = 0;
          this.ethBalance = fw(ethBalance);

        }
      ),
      map(() => {
        return true;
      })
    );

  }

  private listenHistoryStateUpdates$(zp: ZeroPoolNetwork, saveHistory: (val: HistoryState<string>) => void): Observable<any> {

    return zp.zpHistoryState$.pipe(
      tap((historyState: HistoryState<bigint>) => {
        // TODO: think on switchMap here
        const hexified = stringifyUtxoHistoryState(historyState);
        saveHistory(hexified);
      }),
    );

  }

  private listenUtxoStateUpdates$(zp: ZeroPoolNetwork, saveUtxo: (val: MyUtxoState<string>) => void): Observable<any> {

    return zp.utxoState$.pipe(
      tap((utxoState: MyUtxoState<bigint>) => {
        // TODO: think on switchMap here
        const hexified = stringifyUtxoState(utxoState);
        saveUtxo(hexified);
      })
    );

  }


  // todo: catch error
  private pushUpdates$(zp: ZeroPoolNetwork, gasZp: ZeroPoolNetwork): Observable<any> {
    return interval(10000).pipe(
      concatMap(() => {
        return this.updateStates$(zp, gasZp);
      }),
      tap(() => {
        this.zpUpdatesSubject.next(true);
      }),
    );
  }


}

