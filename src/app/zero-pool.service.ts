import { Injectable } from '@angular/core';
import { CircomeLoaderService } from './circome-loader.service';
import { HistoryItem, HistoryState, normalizeUtxoState, ZeroPoolNetwork } from 'zeropool-lib';
import { filter, map } from 'rxjs/operators';
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

  private zpBalance: BehaviorSubject<ZpBalance> = new BehaviorSubject<ZpBalance>(({'0x0': 0}));
  zpBalance$: Observable<ZpBalance> = this.zpBalance.asObservable();

  private zpHistory: BehaviorSubject<HistoryItem[]> = new BehaviorSubject<HistoryItem[]>([]);
  zpHistory$: Observable<HistoryItem[]> = this.zpHistory.asObservable();

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

        zp.zpHistoryState$.subscribe(async historyState => {
          this.stateStorageService.historyState = historyState;
          const history = await zp.utxoHistory();
          this.zpHistory.next(history.items);
        });

        zp.state$.subscribe(async utxoState => {
          this.stateStorageService.utxoState = normalizeUtxoState(utxoState);
          const balance = await zp.getBalance();
          this.zpBalance.next(balance);
        });

        zp.utxoHistory();
        zp.getBalance();
        // this.accountService.ethereumAddress = zp.ZeroPool.web3Ethereum.ethAddress;

        return zp;

      }),
    );
  }
}
