import { Injectable } from '@angular/core';
import { CircomLoaderService } from './circom-loader.service';
import {
  fw,
  HistoryAndBalances,
  HistoryItem,
  HistoryState,
  IMerkleTree,
  MyUtxoState,
  PayNote,
  stringifyUtxoHistoryState,
  stringifyUtxoState,
  Utxo,
  ZeroPoolNetwork
} from 'zeropool-lib';
import { exhaustMap, filter, map, mergeMap, shareReplay, switchMap, tap } from 'rxjs/operators';
import { AccountService } from './account.service';
import { environment } from '../../environments/environment';
import { BehaviorSubject, combineLatest, interval, Observable, of, Subject } from 'rxjs';
import { Web3ProviderService } from './web3.provider.service';
import { StateStorageService } from './state.storage.service';
import { fromPromise } from 'rxjs/internal-compatibility';
import { TransactionBlockerService } from './transaction-blocker.service';

export interface ZpBalance {
  [key: string]: number;
}

@Injectable({
  providedIn: 'root'
})
export class ZeroPoolService {
  private isReady: Subject<boolean> = new BehaviorSubject<boolean>(false);
  public isReady$: Observable<boolean> = this.isReady.asObservable().pipe(
    shareReplay(1)
  );

  public start$: Observable<any>;

  public zp: ZeroPoolNetwork;
  public zpGas: ZeroPoolNetwork;

  public maxAmountToSend: ZpBalance = {};

  public ethBalance: number;
  public zpBalance: ZpBalance;
  public zpHistory: HistoryItem[];
  public activeWithdrawals: PayNote[];

  public lostDeposits: PayNote[];

  public currentBlockNumber: number;

  public zpGasBalance: number;

  public challengeExpiresBlocks: number | string = '?';
  public depositExpiresBlocks: number | string = '?';

  private zpUpdatesSubject = new Subject<boolean>();
  public zpUpdates$: Observable<boolean> = this.zpUpdatesSubject.asObservable();

  constructor(
    private circomService: CircomLoaderService,
    private accountService: AccountService,
    private web3ProviderService: Web3ProviderService,
    private stateStorageService: StateStorageService,
    public transactionBlocker: TransactionBlockerService
  ) {

    const circomLoaded$ = this.circomService.isReady$.pipe(
      filter((isReady) => isReady),
    );

    const web3Loaded$ = this.web3ProviderService.isReady$.pipe(
      filter((isReady: boolean) => isReady),
    );

    this.start$ = this.checkOldContracts().pipe(
      mergeMap(() => {
        return combineLatest([
          circomLoaded$,
          web3Loaded$,
          this.accountService.account$,
          this.stateStorageService.getUtxoState(),
          this.stateStorageService.getHistoryState(),
          this.stateStorageService.getGasUtxoState(),
        ]);
      }),
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
          this.circomService.circomTxJson,
          this.circomService.proverKey,
          utxoState,
          historyState
        );

        const gasWeb3Provider = this.web3ProviderService.getWeb3GasProvider();

        const zpGas = new ZeroPoolNetwork(
          environment.sideChainAddress,
          gasWeb3Provider,
          account.zeropoolMnemonic,
          this.circomService.circomTxJson,
          this.circomService.proverKey,
          gasUtxoState,
        );

        this.zp = zp;
        this.zpGas = zpGas;

        this.listenUpdates();

        if (this.accountService.isNewAccount()) {
          return this.lightUpdate(zp, zpGas).pipe(
            mergeMap(() => {
              return combineLatest([
                fromPromise(this.zp.ZeroPool.getChallengeExpiresBlocks()),
                fromPromise(this.zp.ZeroPool.getDepositExpiresBlocks())
              ]);
            }),
            mergeMap(([challengeExpiresBlocks, depositExpiresBlocks]) => {
              this.challengeExpiresBlocks = +challengeExpiresBlocks;
              this.depositExpiresBlocks = +depositExpiresBlocks;
              this.zpUpdatesSubject.next(true);
              this.isReady.next(true);
              return this.pushUpdates$(zp, zpGas);
            }),
          );
        }

        return this.updateStates$(zp, zpGas).pipe(
          mergeMap(() => {
            return combineLatest([
              fromPromise(this.zp.ZeroPool.getChallengeExpiresBlocks()),
              fromPromise(this.zp.ZeroPool.getDepositExpiresBlocks())
            ]);
          }),
          mergeMap(([challengeExpiresBlocks, depositExpiresBlocks]) => {
            this.challengeExpiresBlocks = +challengeExpiresBlocks;
            this.depositExpiresBlocks = +depositExpiresBlocks;
            this.zpUpdatesSubject.next(true);
            this.isReady.next(true);
            return this.pushUpdates$(zp, zpGas);
          }),
        );

      }),
      shareReplay(1)
    );

  }

  private listenUpdates(): void {
    const listenAndSaveState$ = listenUtxoStateUpdates$(this.zp).pipe(
      switchMap(
        (state: MyUtxoState<string>) => {

          const sortedUtxo = state.utxoList.sort(sortUtxo);
          const groupedUtxo = groupUtxoByToken(sortedUtxo);

          for (const token in groupedUtxo) {
            if (!groupedUtxo.hasOwnProperty(token)) {
              continue;
            }

            this.maxAmountToSend[token] = groupedUtxo[token]
              .slice(0, 2)
              .reduce((acc, utxo) => acc + +utxo.amount, 0);

          }

          return this.stateStorageService.saveUtxo(state);
        }
      )
    );

    const listenAndSaveGasState$ = listenUtxoStateUpdates$(this.zpGas).pipe(
      switchMap(
        (state: MyUtxoState<string>) => {
          return this.stateStorageService.saveGasUtxo(state);
        }
      )
    );

    combineLatest([listenAndSaveState$, listenAndSaveGasState$])
      .subscribe(
        () => {
          // allow to send next transactions
          this.transactionBlocker.unlockTransactionSend();
        }
      );

    listenHistoryStateUpdates$(this.zp).pipe(
      switchMap(
        (state: HistoryState<string>) => {
          return this.stateStorageService.saveHistory(state);
        }
      )
    ).subscribe();
  }

  private updateStates$(
    zp: ZeroPoolNetwork,
    zpGas: ZeroPoolNetwork,
  ): Observable<boolean> {

    const getBalanceAndHistory$ = fromPromise(zp.getBalanceAndHistory());
    const getActiveWithdrawals$ = fromPromise(zp.getActiveWithdrawals());
    const getUncompletedDeposits$ = fromPromise(zp.getUncompleteDeposits());
    const getBlockNumber = fromPromise(zp.ZeroPool.web3Ethereum.getBlockNumber());
    const getGasBalance = fromPromise(zpGas.getBalanceAndHistory());
    const getEthBalance = fromPromise(
      // @ts-ignore todo: fix it
      zp.ZeroPool.web3Ethereum.getBalance(window.ethereum.selectedAddress)
    );

    return combineLatest(
      [
        getBalanceAndHistory$,
        getActiveWithdrawals$,
        getUncompletedDeposits$,
        getBlockNumber,
        getGasBalance,
        getEthBalance
      ]
    ).pipe(
      tap((x) => {
        const [
          balancesAndHistory,
          activeWithdrawals,
          uncompletedDeposits$,
          blockNumber,
          gasBalancesAndHistory,
          ethBalance
        ]: [HistoryAndBalances, PayNote[], PayNote[], number, HistoryAndBalances, string] = x;

        this.zpBalance = balancesAndHistory.balances;
        this.zpHistory = balancesAndHistory.historyItems;
        this.activeWithdrawals = activeWithdrawals;
        this.lostDeposits = uncompletedDeposits$;
        this.currentBlockNumber = blockNumber;

        this.zpGasBalance = gasBalancesAndHistory.balances[environment.ethToken] || 0;
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

          this.zpBalance = { '0x0000000000000000000000000000000000000000': 0 };
          this.zpHistory = [];
          this.activeWithdrawals = [];
          this.lostDeposits = [];
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

  // todo: catch error
  private pushUpdates$(zp: ZeroPoolNetwork, gasZp: ZeroPoolNetwork): Observable<any> {
    return interval(5000).pipe(
      exhaustMap(() => {
        return this.updateStates$(zp, gasZp);
      }),
      tap(() => {
        this.zpUpdatesSubject.next(true);
      }),
    );
  }

  private checkOldContracts(): Observable<any> {
    if (
      environment.contractAddress !== localStorage.getItem('contract-address') ||
      environment.sideChainAddress !== localStorage.getItem('sidechain-contract-address')
    ) {
      localStorage.setItem('contract-address', environment.contractAddress);
      localStorage.setItem('sidechain-contract-address', environment.sideChainAddress);
      return this.stateStorageService.resetStorage().pipe(tap(() => {
        location.reload();
      }));
    }

    return of('');
  }


}

function listenUtxoStateUpdates$(zp: ZeroPoolNetwork): Observable<MyUtxoState<string>> {

  return zp.utxoState$.pipe(
    map((utxoState: MyUtxoState<bigint>) => {
      return stringifyUtxoState(utxoState);
    })
  );

}

function listenHistoryStateUpdates$(zp: ZeroPoolNetwork): Observable<HistoryState<string>> {

  return zp.zpHistoryState$.pipe(
    map((historyState: HistoryState<bigint>) => {
      return stringifyUtxoHistoryState(historyState);
    }),
  );

}

function sortUtxo(a: Utxo<string>, b: Utxo<string>): number {
  const diff = +b.amount - +a.amount;
  if (diff < 0) {
    return -1;
  } else if (diff > 0) {
    return 1;
  } else {
    return 0;
  }
}

function groupUtxoByToken(utxoList: Utxo<string>[]): { [key: string]: Utxo<string>[] } {
  return utxoList.reduce((g, utxo) => {
    g[utxo.token] = g[utxo.token] || [];
    g[utxo.token].push(utxo);
    return g;
  }, {});
}
