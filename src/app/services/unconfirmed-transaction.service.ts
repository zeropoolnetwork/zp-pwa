import { Injectable } from '@angular/core';
import { PayNote, toHex, Tx } from 'zeropool-lib';
import { ZeroPoolService } from './zero-pool.service';
import { combineLatest, Observable } from 'rxjs';
import { filter, map, mergeMap } from 'rxjs/operators';
import { fromPromise } from 'rxjs/internal-compatibility';
import { environment } from '../../environments/environment';
import { RelayerApiService } from './relayer.api.service';

export interface ZpTransaction {
  tx: Tx<string>;
  zpTxHash: string;
}

@Injectable({
  providedIn: 'root'
})
export class UnconfirmedTransactionService {

  static saveDepositTransaction(tx: ZpTransaction): void {
    this.save('deposit', tx);
  }

  private static save(key: string, item: any): void {
    localStorage.setItem(key, JSON.stringify(item));
  }

  constructor(private zpService: ZeroPoolService, private relayerApi: RelayerApiService) {

    const depositZpTx = this.getDepositTransaction();
    if (!depositZpTx) {
      return;
    }

    const unconfirmedDeposit$ = this.getUnconfirmedDeposit(depositZpTx);
    const gasTx$ = this.zpService.isReady$.pipe(
      filter((isReady: boolean) => isReady),
      mergeMap(
        () => {
          return fromPromise(
            this.zpService.zpGas.prepareWithdraw(environment.ethToken, environment.relayerFee)
          );
        }
      )
    );


    combineLatest([unconfirmedDeposit$, gasTx$]).pipe(
      mergeMap(
        ([unconfirmedDeposit, gasTx]: [PayNote | undefined, [Tx<string>, string]]) => {
          if (!unconfirmedDeposit) {
            throw new Error(`cannot find deposit ${depositZpTx.zpTxHash}`);
          }
          return this.relayerApi.sendTx$(depositZpTx.tx, toHex(unconfirmedDeposit.blockNumber), gasTx[0]);
        }
      ),
    ).subscribe(
      (txData: any) => {
        console.log({
          unconfirmedDeposit: txData.transactionHash || txData
        });
        this.deleteDepositTransaction();
      },
      (e) => {
        console.log('unconfirmed transaction failed: ', e.message);
        this.deleteDepositTransaction();
      }
    );


  }

  getUnconfirmedDeposit(tx: ZpTransaction): Observable<PayNote | undefined> {
    return this.zpService.isReady$.pipe(
      filter((isReady: boolean) => isReady),
      mergeMap(() => {
        return fromPromise(
          this.zpService.zp.getUncompleteDeposits()
        );
      }),
      map((payNoteList: PayNote[]) => {
        const unconfirmedDeposit = payNoteList.filter((note) => {
          return note.txHash === tx.zpTxHash;
        });
        return unconfirmedDeposit && unconfirmedDeposit[0];
      })
    );
  }

  deleteDepositTransaction(): void {
    this.delete('deposit');
  }

  getDepositTransaction(): ZpTransaction | undefined {
    return this.get<ZpTransaction>('deposit');
  }

  private get<T>(key: string): T | undefined {
    const item = localStorage.getItem(key);
    try {
      return JSON.parse(item) as T;
    } catch (e) {
      return undefined;
    }
  }

  private delete(key: string): void {
    localStorage.removeItem(key);
  }

}
