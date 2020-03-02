import { Component, OnInit } from '@angular/core';
import { fw, PayNote } from 'zeropool-lib';
import { ZeroPoolService } from '../../services/zero-pool.service';
import { environment } from '../../../environments/environment';
import { fromPromise } from 'rxjs/internal-compatibility';
import { Transaction } from 'web3-core';

@Component({
  selector: 'app-withdrawals-list',
  templateUrl: './withdrawals-list.component.html',
  styleUrls: ['./withdrawals-list.component.scss']
})
export class WithdrawalsListComponent {

  withdrawals: PayNote[];
  expiresBlockNumber: number;

  constructor(
    private zpService: ZeroPoolService
  ) {
    this.expiresBlockNumber = this.zpService.challengeExpiresBlocks;
    this.withdrawals = this.zpService.activeWithdrawals;
  }

  isFinalizingNow(w: PayNote): boolean {
    return localStorage.getItem(w.txHash) === 'in-progress';
  }

  withdraw(w: PayNote): void {
    localStorage.setItem(w.txHash, 'in-progress');
    fromPromise(this.zpService.zp.withdraw(w)).subscribe(
      (tx: Transaction) => {
        // @ts-ignore
        console.log(tx.transactionHash);
      }
    );
  }

  isReadyToFinalize(withdrawBlockNumber: number): boolean {
    const remainingBlockNum = this.zpService.currentBlockNumber - withdrawBlockNumber;
    return remainingBlockNum > this.expiresBlockNumber;
  }

  getRemainingBlockNumber(withdrawBlockNumber: number): number {
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
