import { Component } from '@angular/core';
import { fw, PayNote } from 'zeropool-lib';
import { ZeroPoolService } from '../../services/zero-pool.service';
import { environment } from '../../../environments/environment';
import { catchError, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { TransactionService } from '../../services/transaction.service';

@Component({
  selector: 'app-deposit-cancel',
  templateUrl: './deposit-cancel.component.html',
  styleUrls: ['./deposit-cancel.component.scss']
})
export class DepositCancelComponent {

  lostDeposits: PayNote[];

  isAvailableNewDeposit = true;

  constructor(
    private zpService: ZeroPoolService,
    private txService: TransactionService
  ) {

    this.lostDeposits = this.zpService.lostDeposits;
  }

  isFinalizingNow(w: PayNote): boolean {
    return localStorage.getItem(w.txHash) === 'in-progress';
  }

  cancelDeposit(w: PayNote): void {
    localStorage.setItem(w.txHash, 'in-progress');
    this.txService.withdraw(w).pipe(
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

  // isReadyToFinalize(withdrawBlockNumber: number): boolean {
  //   const remainingBlockNum = this.zpService.currentBlockNumber - withdrawBlockNumber;
  //   return remainingBlockNum > this.expiresBlockNumber;
  // }

  // getRemainingBlockNumber(withdrawBlockNumber: number): number | string {
  //
  //   if (typeof this.expiresBlockNumber !== 'number') {
  //     return '?';
  //   }
  //
  //   const remainingBlockNum = this.zpService.currentBlockNumber - withdrawBlockNumber;
  //   if (remainingBlockNum > this.expiresBlockNumber) {
  //     return this.expiresBlockNumber;
  //   }
  //   return remainingBlockNum;
  // }

  getAmount(val: number): number {
    return fw(val);
  }

  getAssetName(assetAddress: string) {
    return assetAddress === environment.ethToken ? 'ETH' : '';
  }

}
