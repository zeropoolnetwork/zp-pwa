import { Component, OnInit } from '@angular/core';
import { AccountService, IAccount } from '../services/account.service';
import { ZeroPoolService } from '../services/zero-pool.service';
import { interval, Observable, Subscription, timer } from 'rxjs';
import { fw, HistoryItem, PayNote } from 'zeropool-lib';
import { MatTooltip } from '@angular/material/tooltip';
import { delay, tap } from 'rxjs/operators';
import { Web3ProviderService } from '../services/web3.provider.service';
import { Clipboard } from '@angular/cdk/clipboard';
import { AutoJoinUtxoService } from '../services/auto-join-utxo.service';
import { Router } from '@angular/router';
import { depositProgress$, UnconfirmedTransactionService } from '../services/unconfirmed-transaction.service';
import { environment } from '../../environments/environment';
import { BackgroundService } from '../services/background.service';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit {

  isNeedToShowLoader = true;

  account$: Observable<IAccount>;

  zpGasBalance: number;
  balance: number;

  history: HistoryItem[];
  tooltipMessage = 'Copy to clipboard';

  hasDepositInProgress = false;
  hasGasDepositInProgress = false;


  totalWithdrawals = 0;
  totalUncompletedDeposits = 0;

  get hasWithdrawals() {
    return this.totalWithdrawals > 0;
  }

  hasVerifiedWithdrawals = false;

  color = 'rgba(100, 100, 100, 0.5)';

  subscription: Subscription;

  constructor(
    private accountSvc: AccountService,
    private zpService: ZeroPoolService,
    private web3Service: Web3ProviderService,
    private clipboard: Clipboard,
    private backgroundService: BackgroundService
  ) {

    this.account$ = this.accountSvc.account$;

    this.subscription = this.zpService.zpUpdates$.subscribe(() => {
      this.accountSvc.deleteNewAccountFlag();
      this.updateUiState();
    });

    // Poling of gasDeposit
    const ongoingGasDepositsPoling$ = interval(500).pipe();
    this.subscription.add(ongoingGasDepositsPoling$.subscribe(
      () => {
        this.hasGasDepositInProgress = UnconfirmedTransactionService.hasGasDepositTransaction();
      }
    ));

    // Polling of deposit
    this.subscription.add(depositProgress$.subscribe(
      (progress) => {
        this.hasDepositInProgress = progress && true;
      }, () => {

      }, () => {
        this.hasDepositInProgress = false;
      }
    ));
  }

  updateUiState() {
    this.balance = fw(this.zpService.zpBalance[environment.ethToken]) || 0;
    this.history = this.zpService.zpHistory;
    this.zpGasBalance = fw(this.zpService.zpGasBalance);

    this.hasDepositInProgress = UnconfirmedTransactionService.hasOngoingDepositTransaction();

    this.totalWithdrawals = this.zpService.activeWithdrawals.length;

    if (this.hasDepositInProgress) {
      const isDepositInProgress = this.zpService.lostDeposits.find((lostDeposit) => {
        return lostDeposit.txHash === UnconfirmedTransactionService.getDepositTransaction().txHash;
      });
      this.totalUncompletedDeposits = isDepositInProgress
        ? this.zpService.lostDeposits.length
        : this.zpService.lostDeposits.length + 1;
    } else {
      this.totalUncompletedDeposits = this.zpService.lostDeposits.length;
    }

    if (this.totalWithdrawals !== 0 && (typeof this.zpService.challengeExpiresBlocks === 'number')) {
      //
      const readyBlock = this.zpService.currentBlockNumber - this.zpService.challengeExpiresBlocks;

      this.zpService.activeWithdrawals.forEach(
        (payNote: PayNote) => {
          if (payNote.blockNumber <= readyBlock) {
            this.hasVerifiedWithdrawals = true;
          }
        }
      );
    }

    this.isNeedToShowLoader = false;
  }

  ngOnInit(): void {
    if (this.zpService.zpBalance) {
      this.updateUiState();
    }
  }

}
