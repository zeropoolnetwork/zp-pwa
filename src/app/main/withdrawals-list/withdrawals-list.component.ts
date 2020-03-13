import { Component } from '@angular/core';
import { fw, PayNote } from 'zeropool-lib';
import { ZeroPoolService } from '../../services/zero-pool.service';
import { environment } from '../../../environments/environment';
import { catchError, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { TransactionService } from '../../services/transaction.service';

@Component({
  selector: 'app-withdrawals-list',
  templateUrl: './withdrawals-list.component.html',
  styleUrls: ['./withdrawals-list.component.scss']
})
export class WithdrawalsListComponent {

  withdrawals: PayNote[];
  expiresBlockNumber: number | string;

  isAvailableNewWithdraw = false;

  constructor(
    private zpService: ZeroPoolService,
    private txService: TransactionService
  ) {

    this.expiresBlockNumber = this.zpService.challengeExpiresBlocks;
    this.withdrawals = this.zpService.activeWithdrawals;

    this.checkZpEthBalance();
    zpService.zpUpdates$.subscribe(
      () => {
        this.checkZpEthBalance();
        this.withdrawals = this.zpService.activeWithdrawals;
      }
    );
  }

  checkZpEthBalance() {
    if (this.zpService.zpBalance) {
      this.isAvailableNewWithdraw = !!this.zpService.zpBalance[environment.ethToken];
    }
  }

  isFinalizingNow(w: PayNote): boolean {
    return localStorage.getItem(w.txHash) === 'in-progress';
  }

  withdraw(w: PayNote): void {
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
