import { Component, OnInit } from '@angular/core';
import { AccountService, IAccount } from '../services/account.service';
import { ZeroPoolService } from '../services/zero-pool.service';
import { interval, Observable, Subscription, timer } from 'rxjs';
import { fw, HistoryItem, PayNote } from 'zeropool-lib';
import { MatTooltip } from '@angular/material/tooltip';
import { delay, filter, tap } from 'rxjs/operators';
import { Web3ProviderService } from '../services/web3.provider.service';
import { Clipboard } from '@angular/cdk/clipboard';
import { AutoJoinUtxoService } from '../services/auto-join-utxo.service';
import { Router } from '@angular/router';
import { UnconfirmedTransactionService } from '../services/unconfirmed-transaction.service';
import { environment } from '../../environments/environment';

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

  // amountOfPendingWithdrawals = 1;
  // amountOfVerifiedWithdrawals = 3;

  hasDepositInProgress = false;
  hasGasDepositInProgress = false;

  totalWithdrawals = 0;
  hasWithdrawals = false;
  hasVerifiedWithdrawals = true;

  color = 'rgba(100, 100, 100, 0.5)';

  subscription: Subscription;

  constructor(
    private accountSvc: AccountService,
    private zpService: ZeroPoolService,
    private web3Service: Web3ProviderService,
    private clipboard: Clipboard,
    private autoJoin: AutoJoinUtxoService,
    private unconfirmedTx: UnconfirmedTransactionService,
    private router: Router
  ) {

    this.account$ = this.accountSvc.account$;
    this.zpService.start$.subscribe(); // Unsubscribe ?? - Обсудить с Кириллом

    this.subscription = this.zpService.zpUpdates$.subscribe(() => {
      this.accountSvc.deleteNewAccountFlag();
      this.updateUiState();
    });

    // Poling of gasDeposit
    const ongoingGasDepositsPoling$ = interval(500).pipe();
    this.subscription.add(ongoingGasDepositsPoling$.subscribe(
      () => {
        this.hasGasDepositInProgress = UnconfirmedTransactionService.hasGasDepositTransaction()
      }
    ));

    // Poling of deposit
    const ongoingDepositsPoling$ = interval(500).pipe();
    this.subscription.add(ongoingDepositsPoling$.subscribe(
      () => {
        this.hasDepositInProgress = UnconfirmedTransactionService.hasOngoingDepositTransaction()
      }
    ));

  }

  connectWallet() {
    this.web3Service.connectWeb3();
  }

  updateUiState() {
    this.balance = fw(this.zpService.zpBalance[environment.ethToken]) || 0;
    this.history = this.zpService.zpHistory;
    this.zpGasBalance = fw(this.zpService.zpGasBalance);

    this.totalWithdrawals = this.zpService.activeWithdrawals.length;

    if (this.totalWithdrawals !== 0 && (typeof this.zpService.challengeExpiresBlocks == 'number')) {
      //
      this.hasWithdrawals = true;
      const readyBlock = this.zpService.currentBlockNumber - this.zpService.challengeExpiresBlocks;
      //
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

  // TODO: move to separate component or directive
  onAddressClick(tooltip: MatTooltip, account: IAccount) {

    tooltip.hide();
    this.clipboard.copy(account.zeropoolAddress);

    timer(250).pipe(
      tap(() => {
        this.tooltipMessage = 'Copied!';
        tooltip.show();
      }),
      delay(1000),
      tap(() => {
        tooltip.hide();
      }),
      delay(50),
      tap(() => {
        this.tooltipMessage = 'Copy to clipboard';
      }),
    ).subscribe(() => {
      console.log('!');
    });
  }

}
