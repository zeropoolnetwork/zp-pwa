import { Component } from '@angular/core';
import { fw, PayNote } from 'zeropool-lib';
import { ZeroPoolService } from '../../services/zero-pool.service';
import { environment } from '../../../environments/environment';
import { catchError, distinctUntilChanged, exhaustMap, filter, map, mergeMap, shareReplay, take, tap } from 'rxjs/operators';
import { BehaviorSubject, combineLatest, merge, Observable, of } from 'rxjs';
import { TransactionService } from '../../services/transaction.service';
import { fromPromise } from 'rxjs/internal-compatibility';
import { Router } from '@angular/router';
import { BackgroundService } from '../../services/background.service';

interface IWrappedPayNote {
  payNote: PayNote;
  isFinalizingNow: boolean;
  isAwaitingForMetamaskSign: boolean;
}

@Component({
  selector: 'app-withdrawals-list',
  templateUrl: './withdrawals-list.component.html',
  styleUrls: ['./withdrawals-list.component.scss']
})
export class WithdrawalsListComponent {

  expiresBlockNumber = this.zpService.isReady$.pipe(
    filter(x => x),
    map(() => {
      return this.zpService.challengeExpiresBlocks;
    }),
    shareReplay(1)
  );

  refreshPageAfterWithdrawal = false;
  isAvailableNewWithdraw = false;

  withdrawals$: Observable<IWrappedPayNote[]>;

  checkingMetaMask: { [key: string]: boolean } = {};

  // Buttons(paynote txHash) that we should replace with spinner
  private buttonsSubject: BehaviorSubject<string[]> = new BehaviorSubject([]);

  // Button(paynote txHash) that we should replace with check metamask message
  private metamaskSubject: BehaviorSubject<string[]> = new BehaviorSubject([]);

  constructor(
    private zpService: ZeroPoolService,
    private txService: TransactionService,
    private router: Router,
    private backgroundService: BackgroundService
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
            isFinalizingNow,
            isAwaitingForMetamaskSign: false
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
      this.buttonsSubject.asObservable().pipe(distinctUntilChanged()),
      this.metamaskSubject.asObservable().pipe(distinctUntilChanged()),
    ]).pipe(
      map((x) => {
        const [w, b, m]: [IWrappedPayNote[], string[], string[]] = x;

        return w.map((wrappedPayNote: IWrappedPayNote) => {
          const txHash = wrappedPayNote.payNote.txHash;
          if (b.indexOf(txHash) !== -1) {
            wrappedPayNote.isFinalizingNow = true;
          }
          if (m.indexOf(txHash) !== -1) {
            wrappedPayNote.isAwaitingForMetamaskSign = true;
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

    this.checkingMetaMask[w.txHash] = true;
    // Step 1
    this.metamaskSubject.next([
      ...this.metamaskSubject.value,
      w.txHash
    ]);

    this.txService.withdraw(w, (error: any, txHash: string | undefined) => {

      // Step 2: Reset metamask
      const updatedButtons = this.metamaskSubject.value.filter((id) => id !== w.txHash);
      this.metamaskSubject.next(updatedButtons);

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

  isReadyToFinalize(withdrawBlockNumber: number): Observable<boolean> {

    return this.expiresBlockNumber.pipe(
      map((expiresBlockNumber: number) => {
        const remainingBlockNum = this.zpService.currentBlockNumber - withdrawBlockNumber;
        return remainingBlockNum > expiresBlockNumber;
      })
    );

  }

  getRemainingBlockNumber(withdrawBlockNumber: number): Observable<number | string> {

    return this.expiresBlockNumber.pipe(
      map((challengeExpiresBlocks: number) => {
        if (typeof this.zpService.challengeExpiresBlocks !== 'number') {
          return '?';
        }

        const remainingBlockNum = this.zpService.currentBlockNumber - withdrawBlockNumber;
        if (remainingBlockNum > challengeExpiresBlocks) {
          return challengeExpiresBlocks;
        }
        return remainingBlockNum;
      })
    );

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
        isFinalizingNow: !!localStorage.getItem(payNote.txHash),
        isAwaitingForMetamaskSign: false
      };
    }
  );
}
