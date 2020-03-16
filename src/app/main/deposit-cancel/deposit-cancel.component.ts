import { Component } from '@angular/core';
import { fw, PayNote } from 'zeropool-lib';
import { ZeroPoolService } from '../../services/zero-pool.service';
import { environment } from '../../../environments/environment';
import { catchError, exhaustMap, filter, map, mergeMap, shareReplay, take, tap } from 'rxjs/operators';
import { BehaviorSubject, combineLatest, merge, Observable, of } from 'rxjs';
import { TransactionService } from '../../services/transaction.service';
import { fromPromise } from 'rxjs/internal-compatibility';
import { Router } from '@angular/router';
import { BackgroundService } from '../../services/background.service';

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

  expiresBlockNumber = this.zpService.isReady$.pipe(
    filter(x => x),
    map(() => {
      return this.zpService.depositExpiresBlocks;
    }),
    shareReplay(1)
  );

  refreshPageAfterCancelDeposit = false;
  withdrawals$: Observable<IWrappedPayNote[]>;

  private buttonsSubject: BehaviorSubject<string[]> = new BehaviorSubject([]);

  constructor(
    private zpService: ZeroPoolService,
    private txService: TransactionService,
    private backgroundService: BackgroundService,
    private router: Router
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
        this.refreshPageAfterCancelDeposit = this.zpService.lostDeposits.length <= 1;
        return wrapPayNoteList(this.zpService.lostDeposits || []);
      }),
      exhaustMap((w: IWrappedPayNote[]) => {
        return combineLatest(
          w.map(isFinalizingNow$)
        );
      }),
    );

    const w$ = merge(
      of(wrapPayNoteList(this.zpService.lostDeposits || [])),
      activeWithdrawalsUpdate$
    );

    this.withdrawals$ = combineLatest([
      w$,
      this.buttonsSubject.asObservable()
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
      }),
    );
  }

  withdraw(w: PayNote): void {
    this.txService.depositCancel(w, (error: any, txHash: string | undefined) => {
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
          depositCancel: txHash
        });
        const updatedButtons = this.buttonsSubject.value.filter((id) => id !== w.txHash);
        this.buttonsSubject.next(updatedButtons);

        this.zpService.lostDeposits =
          this.zpService.lostDeposits.filter((x) => x.txHash !== w.txHash);

        if (this.refreshPageAfterCancelDeposit) {
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

  isReadyToFinalize(withdrawBlockNumber: number): Observable<boolean> {

    return this.expiresBlockNumber.pipe(
      map((expiresBlockNumber) => {
        const remainingBlockNum = this.zpService.currentBlockNumber - withdrawBlockNumber;
        return remainingBlockNum > expiresBlockNumber;
      })
    );

  }

  getRemainingBlockNumber(withdrawBlockNumber: number): Observable<number | string> {

    return this.expiresBlockNumber.pipe(
      map((expiresBlockNumber) => {
        if (typeof expiresBlockNumber !== 'number') {
          return '?';
        }

        const remainingBlockNum = this.zpService.currentBlockNumber - withdrawBlockNumber;
        if (remainingBlockNum > expiresBlockNumber) {
          return expiresBlockNumber;
        }
        return remainingBlockNum;
      })
    );

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

