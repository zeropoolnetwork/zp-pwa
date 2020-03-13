import { Component } from '@angular/core';
import { fw, PayNote } from 'zeropool-lib';
import { ZeroPoolService } from '../../services/zero-pool.service';
import { environment } from '../../../environments/environment';
import { catchError, distinctUntilChanged, exhaustMap, filter, map, mergeMap, take, tap } from 'rxjs/operators';
import { BehaviorSubject, combineLatest, merge, Observable, of } from 'rxjs';
import { TransactionService } from '../../services/transaction.service';
import { Transaction } from 'web3-core';
import { fromPromise } from 'rxjs/internal-compatibility';

interface IWrappedPayNote {
  payNote: PayNote;
  isFinalizingNow: boolean;
}

@Component({
  selector: 'app-withdrawals-list',
  templateUrl: './withdrawals-list.component.html',
  styleUrls: ['./withdrawals-list.component.scss']
})
export class WithdrawalsListComponent {

  expiresBlockNumber: number | string;

  isAvailableNewWithdraw = false;

  withdrawals$: Observable<IWrappedPayNote[]>;

  private buttonsSubject: BehaviorSubject<string[]> = new BehaviorSubject([]);

  constructor(
    private zpService: ZeroPoolService,
    private txService: TransactionService
  ) {

    this.expiresBlockNumber = this.zpService.challengeExpiresBlocks;

    this.checkZpEthBalance();

    const isFinalizingNow$ = (w: IWrappedPayNote): Observable<IWrappedPayNote> => {
      return this.isFinalizingNow(w.payNote).pipe(
        tap((isFinalizingNow: boolean) => {
          if (!isFinalizingNow) {
            localStorage.removeItem(w.payNote.txHash);
          }
        }),
        map((isFinalizingNow: boolean) => {
          return {
            payNote: w.payNote,
            isFinalizingNow
          };
        })
      );
    };

    const activeWithdrawalsUpdate$ = zpService.zpUpdates$.pipe(
      map(() => {
        this.checkZpEthBalance();
        return wrappPayNoteList(this.zpService.activeWithdrawals || []);
      }),
      exhaustMap((w: IWrappedPayNote[]) => {
        return combineLatest(
          w.map(isFinalizingNow$)
        );
      }),
    );

    const x$ = merge(
      of(wrappPayNoteList(this.zpService.activeWithdrawals || [])),
      activeWithdrawalsUpdate$
    );

    this.withdrawals$ = combineLatest([
      x$,
      this.buttonsSubject.asObservable().pipe(distinctUntilChanged())
    ]).pipe(
      map((x) => {
        const [w, s]: [IWrappedPayNote[], string[]] = x;
        return w.map((wrappedPayNote: IWrappedPayNote) => {
          if (s.indexOf(wrappedPayNote.payNote.txHash) !== -1) {
            wrappedPayNote.isFinalizingNow = true;
          }

          return wrappedPayNote;
        });
      })
    );

  }

  checkZpEthBalance() {
    if (this.zpService.zpBalance) {
      this.isAvailableNewWithdraw = !!this.zpService.zpBalance[environment.ethToken];
    }
  }

  isFinalizingNow(w: PayNote): Observable<boolean> {
    const ethTxHash = localStorage.getItem(w.txHash);
    if (!ethTxHash) {
      return of(false);
    }

    return this.zpService.isReady$.pipe(
      filter((isReady: boolean) => isReady),
      tap((tx: boolean) => {
        console.log(tx);
      }),
      take(1),
      mergeMap(() => {
        return fromPromise(this.zpService.zp.ZeroPool.web3Ethereum.getTransaction(ethTxHash));
      }),
      map((tx: Transaction) => {
        return !!tx;
      }),
      tap((tx: boolean) => {
        console.log(tx);
      })
    );
  }

  withdraw(w: PayNote): void {
    this.txService.withdraw(w, (txHash: string) => {
      // map: zpTx => ethTx
      localStorage.setItem(w.txHash, txHash);
      this.buttonsSubject.next([
        ...this.buttonsSubject.value,
        w.txHash
      ]);
    }).pipe(
      tap((txHash: any) => {
        console.log({
          withdraw: txHash
        });
      }),
      catchError((e) => {
        localStorage.removeItem(w.txHash);
        console.log(e);
        return of('');
      })
    ).subscribe();
  }

  isReadyToFinalize(withdrawBlockNumber: number): boolean {
    const remainingBlockNum = this.zpService.currentBlockNumber - withdrawBlockNumber;
    return remainingBlockNum > this.expiresBlockNumber;
  }

  getRemainingBlockNumber(withdrawBlockNumber: number): number | string {

    if (typeof this.expiresBlockNumber !== 'number') {
      return '?';
    }

    const remainingBlockNum = this.zpService.currentBlockNumber - withdrawBlockNumber;
    if (remainingBlockNum > this.expiresBlockNumber) {
      return this.expiresBlockNumber;
    }
    return remainingBlockNum;
  }

  getAmount(val: number): number {
    return fw(val);
  }

  getAssetName(assetAddress: string) {
    if (assetAddress === environment.ethToken) {
      return 'ETH';
    }
  }

}

function wrappPayNoteList(withdrawals: PayNote[]): IWrappedPayNote[] {
  return withdrawals.map(
    (payNote: PayNote) => {
      return {
        payNote,
        isFinalizingNow: !!localStorage.getItem(payNote.txHash)
      };
    }
  );
}
