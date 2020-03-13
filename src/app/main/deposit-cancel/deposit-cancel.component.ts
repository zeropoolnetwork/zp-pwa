import { Component } from '@angular/core';
import { fw, PayNote } from 'zeropool-lib';
import { ZeroPoolService } from '../../services/zero-pool.service';
import { environment } from '../../../environments/environment';
import { catchError, distinctUntilChanged, exhaustMap, filter, map, mergeMap, take, tap } from 'rxjs/operators';
import { BehaviorSubject, combineLatest, merge, Observable, of } from 'rxjs';
import { TransactionService } from '../../services/transaction.service';
import { fromPromise } from 'rxjs/internal-compatibility';
import { Transaction } from 'web3-core';

interface IWrappedPayNote {
  payNote: PayNote;
  isFinalizingNow: boolean;
}

@Component({
  selector: 'app-deposit-cancel',
  templateUrl: './deposit-cancel.component.html',
  styleUrls: ['./deposit-cancel.component.scss']
})
export class DepositCancelComponent {

  expiresBlockNumber = this.zpService.challengeExpiresBlocks;

  isAvailableNewDeposit = true;
  withdrawals$: Observable<IWrappedPayNote[]>;

  private buttonsSubject: BehaviorSubject<string[]> = new BehaviorSubject([]);

  constructor(
    private zpService: ZeroPoolService,
    private txService: TransactionService
  ) {

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
        return wrappPayNoteList(this.zpService.lostDeposits || []);
      }),
      exhaustMap((w: IWrappedPayNote[]) => {
        return combineLatest(
          w.map(isFinalizingNow$)
        );
      }),
    );

    const w$ = merge(
      of(wrappPayNoteList(this.zpService.lostDeposits || [])),
      activeWithdrawalsUpdate$
    );

    this.withdrawals$ = combineLatest([
      w$,
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

  cancelDeposit(w: PayNote): void {
    localStorage.setItem(w.txHash, 'in-progress');
    this.txService.depositCancel(w).pipe(
      tap((txHash: any) => {
        console.log({
          depositCancel: txHash
        });
      }),
      catchError((e) => {
        localStorage.removeItem(w.txHash);
        console.log(e);
        return of('');
      })
    ).subscribe();
  }

  getAmount(val: number): number {
    return fw(val);
  }

  getAssetName(assetAddress: string) {
    return assetAddress === environment.ethToken ? 'ETH' : '';
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

