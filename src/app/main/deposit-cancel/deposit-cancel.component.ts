import { Component } from '@angular/core';
import { fw, PayNote } from 'zeropool-lib';
import { ZeroPoolService } from '../../services/zero-pool.service';
import { environment } from '../../../environments/environment';
import { catchError, distinctUntilChanged, exhaustMap, filter, flatMap, map, shareReplay, take, tap } from 'rxjs/operators';
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
  selector: 'app-deposit-cancel',
  templateUrl: './deposit-cancel.component.html',
  styleUrls: ['./deposit-cancel.component.scss']
})
export class DepositCancelComponent {

  expiresBlockNumber = this.zpService.isReady$.pipe(
    filter(x => x),
    take(1),
    map(() => {
      return this.zpService.depositExpiresBlocks;
    }),
    shareReplay(1)
  );

  refreshPageAfterCancelDeposit = false;
  withdrawals$: Observable<IWrappedPayNote[]>;

  // Buttons(paynote txHash) that we should replace with spinner
  private buttonsSubject: BehaviorSubject<string[]> = new BehaviorSubject([]);

  // Button(paynote txHash) that we should replace with check metamask message
  private metamaskSubject: BehaviorSubject<string[]> = new BehaviorSubject([]);

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
            isFinalizingNow,
            isAwaitingForMetamaskSign: false
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

  isFinalizingNow(w: PayNote): Observable<boolean> {
    const ethTxHash = localStorage.getItem(w.txHash);
    if (!ethTxHash) {
      return of(false);
    }

    return this.zpService.isReady$.pipe(
      filter((isReady: boolean) => isReady),
      take(1),
      flatMap(() => {
        const w3eth = this.zpService.zp.ZeroPool.web3Ethereum;
        const all$ = Promise.all([
          w3eth.getTransaction(ethTxHash),
          w3eth.getTransactionReceipt(ethTxHash)
        ]);
        return fromPromise(all$);
      }),
      map(([tx, receipt]) => {
        const hasFailedEthTx = receipt && tx.blockNumber && !receipt.status;
        const isTransactionPublished = () => !!tx;
        //
        return hasFailedEthTx ? false : isTransactionPublished();
      }),
    );
  }

  withdraw(w: PayNote): void {

    // Step 1
    this.openCheckMetamask(w.txHash);

    this.txService.depositCancel(w, (error: any, txHash: string | undefined) => {

      // Step 2: Reset metamask
      this.closeCheckMetamask(w.txHash);

      if (error) {
        return;
      }

      // map: zpTx => ethTx
      localStorage.setItem(w.txHash, txHash);
      this.openButtonLoader(w.txHash);
    }).pipe(
      tap((txHash: any) => {
        localStorage.removeItem(w.txHash);
        console.log({
          depositCancel: txHash
        });

        this.closeButtonLoader(w.txHash);

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

  getAmount(val: number): number {
    return fw(val);
  }

  getAssetName(assetAddress: string) {
    return assetAddress === environment.ethToken ? 'ETH' : '';
  }

  private closeButtonLoader(txHash: string): void {
    const updatedButtons = this.buttonsSubject.value.filter((id) => id !== txHash);
    this.buttonsSubject.next(updatedButtons);
  }

  private openButtonLoader(txHash: string): void {
    this.buttonsSubject.next([
      ...this.buttonsSubject.value,
      txHash
    ]);
  }

  private closeCheckMetamask(txHash: string): void {
    const updatedButtons = this.metamaskSubject.value.filter((id) => id !== txHash);
    this.metamaskSubject.next(updatedButtons);
  }

  private openCheckMetamask(txHash: string): void {
    this.metamaskSubject.next([
      ...this.metamaskSubject.value,
      txHash
    ]);
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

