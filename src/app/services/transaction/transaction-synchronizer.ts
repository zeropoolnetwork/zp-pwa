import { Observable, Subject } from 'rxjs';
import { concatMap, filter, map, mergeMap, tap } from 'rxjs/operators';
import { fromPromise } from 'rxjs/internal-compatibility';
import { Tx, ZeroPoolNetwork } from 'zeropool-lib';
import { v4 as uuidv4 } from 'uuid';

export interface ScheduledTransaction {
  type: 'prepareDeposit' | 'transfer' | 'prepareWithdraw';
  amount: number;
  token?: string;
  to?: string;
  progressCallback?: (msg) => void;
  id?: string;
}

interface DoneTransaction {
  tx: Tx<string>;
  txHash: string;
  id: string;
}

export class TransactionSynchronizer {

  private queueTransactionCount = 0;

  private queue: Subject<ScheduledTransaction> = new Subject<ScheduledTransaction>();
  private queue$: Observable<ScheduledTransaction> = this.queue.asObservable();

  private doneTransactions: Subject<DoneTransaction> = new Subject();
  private doneTransactions$: Observable<DoneTransaction> = this.doneTransactions.asObservable();

  constructor(private zp: ZeroPoolNetwork) {

    this.queue$.pipe(
      tap((tx: ScheduledTransaction) => {
        this.queueTransactionCount += 1;

        if (this.queueTransactionCount > 1) {
          tx.progressCallback('queue');
        }
      }),
      concatMap(
        (tx: ScheduledTransaction) => {

          return fromPromise(this.zp.getBalance()).pipe(
            mergeMap(() => {
              let txData: Promise<[Tx<string>, string]>;

              switch (tx.type) {
                case 'prepareDeposit':
                  txData = this.zp.prepareDeposit(tx.token, tx.amount, tx.progressCallback);
                  break;
                case 'transfer':
                  txData = this.zp.transfer(tx.token, tx.to, tx.amount, tx.progressCallback);
                  break;
                case 'prepareWithdraw':
                  txData = this.zp.prepareWithdraw(tx.token, tx.amount, tx.progressCallback);
                  break;
              }

              return fromPromise(txData);
            }),
            map(([zpTx, zpTxHash]: [Tx<string>, string]): DoneTransaction => {
              return {
                txHash: zpTxHash,
                tx: zpTx,
                id: tx.id
              };
            }),
          );
        }
      )
    ).subscribe((doneTx: DoneTransaction) => {
      this.queueTransactionCount -= 1;
      this.doneTransactions.next(doneTx);
    });

  }

  public runTransaction(tx: ScheduledTransaction): Observable<[Tx<string>, string]> {
    const id = uuidv4();
    tx.id = id;
    this.queue.next(tx);
    return this.doneTransactions$.pipe(
      filter((doneTx: DoneTransaction) => doneTx.id === id),
      map((doneTx: DoneTransaction) => {
        return [doneTx.tx, doneTx.txHash];
      })
    );
  }

}
