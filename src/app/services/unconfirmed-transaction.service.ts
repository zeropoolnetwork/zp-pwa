import { Injectable } from '@angular/core';
import { PayNote, toHex, Tx, ZeroPoolNetwork } from 'zeropool-lib';
import { ZeroPoolService } from './zero-pool.service';
import { combineLatest, defer, Observable, of, timer } from 'rxjs';
import { catchError, delay, exhaustMap, filter, map, mergeMap, repeatWhen, take, takeWhile, tap } from 'rxjs/operators';
import { BehaviorSubject, combineLatest, defer, Observable, of, timer } from 'rxjs';
import { delay, exhaustMap, filter, map, mergeMap, repeatWhen, take, takeWhile, tap } from 'rxjs/operators';
import { fromPromise } from 'rxjs/internal-compatibility';
import { environment } from '../../environments/environment';
import { RelayerApiService } from './relayer.api.service';
import { TransactionSyncronizer } from './observable-synchronizer';
import { TransactionReceipt } from 'web3-core';

export interface ZpTransaction {
  tx: Tx<string>;
  txHash: string;
  timestamp?: number;
}

const dateExpiresInMinutes = 1;

@Injectable({
  providedIn: 'root'
})
export class UnconfirmedTransactionService {

  static saveDepositTransaction(tx: ZpTransaction): void {
    this.save('deposit', {
      tx: tx.tx,
      txHash: tx.txHash,
      timestamp: Date.now()
    });
  }

  static deleteDepositTransaction(): void {
    this.delete('deposit');
  }

  static hasOngoingDepositTransaction(): boolean {
    return !!localStorage.getItem('deposit');
  }

  static saveGasDepositTransaction(tx: ZpTransaction): void {
    this.save('gas-deposit', {
      tx: tx.tx,
      txHash: tx.txHash,
      timestamp: Date.now()
    });
  }

  static hasGasDepositTransaction(): boolean {
    return !!localStorage.getItem('gas-deposit');
  }

  static deleteGasDepositTransaction(): void {
    this.delete('gas-deposit');
  }

  private static save(key: string, item: any): void {
    localStorage.setItem(key, JSON.stringify(item));
  }

  private static delete(key: string): void {
    localStorage.removeItem(key);
  }

  constructor(private zpService: ZeroPoolService, private relayerApi: RelayerApiService) {
    this.tryDeposit();
    this.tryGasDeposit();
  }

  private tryGasDeposit(): void {
    const depositZpTx = this.getGasDepositTransaction();
    if (!depositZpTx) {
      return;
    }

    const txHash$ = this.zpService.isReady$.pipe(
      filter((isReady: boolean) => isReady),
      take(1),
      mergeMap(() => {
        return this.waitForTx(this.zpService.zp, depositZpTx.txHash, () => {

          const timePassed = Date.now() - depositZpTx.timestamp;
          const isExpired = !(timePassed <= 60000 * dateExpiresInMinutes);
          if (isExpired) {
            console.log('unconfirmed gas deposit transaction time expired');
            UnconfirmedTransactionService.deleteGasDepositTransaction();
          }

          return !isExpired && !!this.getGasDepositTransaction();
        }).pipe(filter(x => !!x), take(1));
      })
    );

    const mainNetDonationTx$ = txHash$.pipe(
      mergeMap((txHash: string) => {
        return this.donateGas(depositZpTx, txHash).pipe(
          tap((data: any) => {
            console.log({
              unconfirmedGasDepositLog: data
            });
          }),
          take(1)
        );
      }),
    );

    const depositTakeWhileFunc = () => {
      return (
        Date.now() - depositZpTx.timestamp < 60000 * dateExpiresInMinutes &&
        !!this.getGasDepositTransaction()
      );
    };

    const onDepositError = (e) => {
      UnconfirmedTransactionService.deleteGasDepositTransaction();
      console.log('unconfirmed transaction failed: ', e.message || e);
    };


    this.tryCompleteTransaction(
      mainNetDonationTx$,
      depositTakeWhileFunc,
      onDepositError
    );

  }

  private tryDeposit(): void {
    const depositZpTx = this.getDepositTransaction();
    if (!depositZpTx) {
      return;
    }

    const unconfirmedDeposit$ = this.zpService.isReady$.pipe(
      filter((isReady: boolean) => isReady),
      mergeMap(() => {
        return this.getUnconfirmedDeposit(this.zpService.zp, depositZpTx);
      })
    );

    const gasTx$ = this.zpService.isReady$.pipe(
      filter((isReady: boolean) => isReady),
      mergeMap(
        () => {
          return fromPromise(
            this.zpService.zpGas.prepareWithdraw(environment.ethToken, environment.relayerFee)
          );
        }
      ),
    );

    const tryDeposit$ = combineLatest([unconfirmedDeposit$, gasTx$]).pipe(
      take(1),
      mergeMap((x: any) => {
        const [unconfirmedDeposit, gasTx]: [PayNote | undefined, [Tx<string>, string]] = x;
        return this.trySendTx(unconfirmedDeposit, gasTx[0], depositZpTx).pipe(
          tap((data: any) => {
            console.log({
              unconfirmedDepositLog: data
            });
          })
        );
      }),
    );

    const depositTakeWhileFunc = () => {
      return (
        Date.now() - depositZpTx.timestamp < 60000 * dateExpiresInMinutes &&
        !!this.getDepositTransaction()
      );
    };

    const onDepositError = (e) => {
      UnconfirmedTransactionService.deleteDepositTransaction();
      console.log('unconfirmed transaction failed: ', e.message || e);
    };


    this.tryCompleteTransaction(
      tryDeposit$,
      depositTakeWhileFunc,
      onDepositError
    );

  }

  private tryCompleteTransaction(
    executeTx$: Observable<any>,
    takeWhileFunc: () => boolean,
    onError: (err: any) => void
  ): void {

    const scheduledTxFunc = () => {
      return TransactionSyncronizer.execute({
        observable: executeTx$
      }).pipe(take(1));
    };

    const tryEachMillisecond = 3000;

    defer(scheduledTxFunc).pipe(
      repeatWhen(completed => completed.pipe(delay(tryEachMillisecond))),
      takeWhile(takeWhileFunc),
    ).subscribe(
      () => {
      },
      onError
    );

  }

  private trySendTx(
    depositTx: PayNote,
    gasTx: Tx<string>,
    depositZpTx: ZpTransaction
  ): Observable<string> {

    if (!depositTx || !depositTx.blockNumber) {
      const timePassed = Date.now() - depositZpTx.timestamp;

      if (timePassed > 60000 * dateExpiresInMinutes) {
        UnconfirmedTransactionService.deleteDepositTransaction();
        console.log('unconfirmed deposit transaction time expired');
      }

      return of(`cannot find deposit ${depositZpTx.txHash}`);
    }

    return this.relayerApi.sendTx$(depositZpTx.tx, toHex(depositTx.blockNumber), gasTx).pipe(
      tap(() => {
        UnconfirmedTransactionService.deleteDepositTransaction();
      }),
      mergeMap((txData: any) => {
        return this.waitForTx(this.zpService.zp, txData.transactionHash || txData).pipe(
          filter(x => !!x),
          take(1),
          map(() => {
            return txData.transactionHash || txData;
          })
        );
      })
    );

  }

  private donateGas(
    depositZpTx: ZpTransaction,
    ethTxHash: string
  ): Observable<string> {

    return this.relayerApi.gasDonation$(depositZpTx.tx, ethTxHash).pipe(
      tap(() => {
        UnconfirmedTransactionService.deleteGasDepositTransaction();
      }),
      mergeMap((txData: any) => {
        return this.waitForTx(this.zpService.zpGas, txData.transactionHash || txData).pipe(
          filter(x => !!x),
          take(1),
          map(() => {
            return txData.transactionHash || txData;
          })
        );
      })
    );

  }

  private getUnconfirmedDeposit(zp: ZeroPoolNetwork, tx: ZpTransaction): Observable<PayNote | undefined> {
    return fromPromise(zp.getUncompleteDeposits()).pipe(
      map((payNoteList: PayNote[]) => {
        const unconfirmedDeposit = payNoteList.filter((note) => {
          return note.txHash === tx.txHash;
        });
        return unconfirmedDeposit && unconfirmedDeposit[0];
      }),
      take(2)
    );
  }

  private getDepositTransaction(): ZpTransaction | undefined {
    return this.get<ZpTransaction>('deposit');
  }

  private getGasDepositTransaction(): ZpTransaction | undefined {
    return this.get<ZpTransaction>('gas-deposit');
  }

  private get<T>(key: string): T | undefined {
    const item = localStorage.getItem(key);
    try {
      return JSON.parse(item) as T;
    } catch (e) {
      return undefined;
    }
  }

  private waitForTx(zp: ZeroPoolNetwork, txHash: string, takeWhileFunc?: () => boolean): Observable<string> {

    const txReceipt = new BehaviorSubject(undefined);
    const txReceipt$ = txReceipt.asObservable();

    const onTxReceipt = (err: any, tx: TransactionReceipt) => {

      if (err) {
        console.log(err);
      }

      if (tx && tx.blockNumber) {
        txReceipt.next(tx);
      }

    };

    const timer$ = timer(0, 5000).pipe(
      exhaustMap(() => {
        return fromPromise(zp.ZeroPool.web3Ethereum.getTransactionReceipt(txHash, onTxReceipt))
          .pipe(take(1));
      })
    ).subscribe();

    return txReceipt$.pipe(
      filter(x => !!x),
      tap((tx: TransactionReceipt) => {
          if (takeWhileFunc && !takeWhileFunc()) {
            timer$.unsubscribe();
          }
        }
      ),
      map((tx: TransactionReceipt) => {
        timer$.unsubscribe();
        return tx.transactionHash;
      })
    );

  }

}
