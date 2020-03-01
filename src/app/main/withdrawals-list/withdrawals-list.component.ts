import { Component, OnInit } from '@angular/core';
import { fw, PayNote } from 'zeropool-lib';
import { ZeroPoolService } from '../../services/zero-pool.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-withdrawals-list',
  templateUrl: './withdrawals-list.component.html',
  styleUrls: ['./withdrawals-list.component.scss']
})
export class WithdrawalsListComponent implements OnInit {

  withdrawals: PayNote[];
  expiresBlockNumber: number;

  constructor(
    private zpService: ZeroPoolService
  ) {

    this.expiresBlockNumber = this.zpService.challengeExpiresBlocks;
    this.withdrawals = this.zpService.activeWithdrawals;

  }

  ngOnInit(): void {
  }

  isReady(withdrawBlockNumber: number): boolean {
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
