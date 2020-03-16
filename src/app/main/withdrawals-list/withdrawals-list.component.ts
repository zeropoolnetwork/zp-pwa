import { Component } from '@angular/core';
import { fw, PayNote } from 'zeropool-lib';
import { ZeroPoolService } from '../../services/zero-pool.service';
import { environment } from '../../../environments/environment';
import { catchError, distinctUntilChanged, exhaustMap, filter, map, mergeMap, take, tap } from 'rxjs/operators';
import { BehaviorSubject, combineLatest, merge, Observable, of } from 'rxjs';
import { TransactionService } from '../../services/transaction.service';
import { fromPromise } from 'rxjs/internal-compatibility';
import { StepList } from '../progress-message/transaction-progress';
import { Router } from '@angular/router';

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

  expiresBlockNumber = this.zpService.challengeExpiresBlocks;

  refreshPageAfterWithdrawal = false;
  isAvailableNewWithdraw = false;

  withdrawals$: Observable<IWrappedPayNote[]>;

  private buttonsSubject: BehaviorSubject<string[]> = new BehaviorSubject([]);

  constructor(
    private zpService: ZeroPoolService,
    private txService: TransactionService,
    private router: Router
  ) {

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
        this.refreshPageAfterWithdrawal = this.zpService.lostDeposits.length <= 1;
        return wrapPayNoteList(this.zpService.activeWithdrawals || []);
      }),
      exhaustMap((w: IWrappedPayNote[]) => {
        return combineLatest(
          w.map(isFinalizingNow$)
        );
      }),
    );

    const w$ = merge(
      of(wrapPayNoteList(this.zpService.activeWithdrawals || [])),
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
      take(1),
      mergeMap(() => {
        return combineLatest([
          fromPromise(this.zpService.zp.ZeroPool.web3Ethereum.getTransaction(ethTxHash)),
          fromPromise(this.zpService.zp.ZeroPool.web3Ethereum.getTransactionReceipt(ethTxHash))
        ]);
      }),
      map(([tx, receipt]) => {
        if (receipt && tx.blockNumber && !receipt.status) {
          return false;
        }
        return !!tx;
      })
    );
  }

  withdraw(w: PayNote): void {
    this.txService.withdraw(w, (error: any, txHash: string | undefined) => {
      if (error) {
        return;
      }

      // map: zpTx => ethTx
      localStorage.setItem(w.txHash, txHash);
      this.buttonsSubject.next([
        ...this.buttonsSubject.value,
        w.txHash
      ]);
    }).pipe(
      tap((txHash: any) => {
        localStorage.removeItem(w.txHash);
        console.log({
          withdraw: txHash
        });

        const updatedButtons = this.buttonsSubject.value.filter((id) => id !== w.txHash);
        this.buttonsSubject.next(updatedButtons);

        this.zpService.activeWithdrawals =
          this.zpService.activeWithdrawals.filter((x) => x.txHash !== w.txHash);

        if (this.refreshPageAfterWithdrawal) {
          this.router.navigate(['main']);
        }

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
    return assetAddress === environment.ethToken ? 'ETH' : '';
  }

}

function wrapPayNoteList(withdrawals: PayNote[]): IWrappedPayNote[] {
  return withdrawals.map(
    (payNote: PayNote) => {
      return {
        payNote,
        isFinalizingNow: !!localStorage.getItem(payNote.txHash)
      };
    }
  );
}
