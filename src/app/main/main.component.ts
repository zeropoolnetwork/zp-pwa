import { Component, OnInit } from '@angular/core';
import { AccountService, IAccount } from '../services/account.service';
import { ZeroPoolService } from '../services/zero-pool.service';
import { Observable, of, timer } from 'rxjs';
import { fw, HistoryItem, PayNote, tbn } from 'zeropool-lib';
import { MatTooltip } from '@angular/material/tooltip';
import { delay, filter, tap } from 'rxjs/operators';
import { Web3ProviderService } from '../services/web3.provider.service';
import { Clipboard } from '@angular/cdk/clipboard';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit {

  account$: Observable<IAccount>;

  isConnectedEthereum: boolean;

  zpGasBalance$: Observable<number>;
  balance: number;

  history: HistoryItem[];
  tooltipMessage = 'Copy to clipboard';

  // amountOfPendingWithdrawals = 1;
  // amountOfVerifiedWithdrawals = 3;
  totalWithdrawals = 3;
  hasWithdrawals = false;
  hasVerifiedWithdrawals = true;

  withdrawals$ = of({
    pending: 1,
    verified: 2
  });

  constructor(
    private accountSvc: AccountService,
    private zpService: ZeroPoolService,
    private web3Service: Web3ProviderService,
    private clipboard: Clipboard
  ) {

    this.zpGasBalance$ = this.zpService.zpGasBalance$;

    // TODO: fix problem and use ?. operator
    this.isConnectedEthereum = !!(zpService.zp && zpService.zp.ZeroPool.web3Ethereum.ethAddress);

    web3Service.isReady$.pipe(
      filter(x => !!x)
    ).subscribe(
      () => {
        this.isConnectedEthereum = true;
      }
    );

    this.account$ = this.accountSvc.account$;

    this.zpService.balanceProgressNotificator$
      .subscribe((update) => {
        console.log(update);
      });

    if (this.zpService.zpBalance) {
      this.syncState();
    }


    this.zpService.zpUpdates$.subscribe(() => {
      this.syncState();
    });
  }

  connectWallet() {
    this.web3Service.connectWeb3();
  }

  syncState() {
    const ethAssetId = '0x0';

    this.balance = fw(this.zpService.zpBalance[ethAssetId]) || 0;
    this.history = this.zpService.zpHistory;

    this.totalWithdrawals = this.zpService.activeWithdrawals.length;
    if (this.totalWithdrawals !== 0) {
      this.hasWithdrawals = true;
      const readyBlock = this.zpService.currentBlockNumber - this.zpService.challengeExpiresBlocks;
      this.zpService.activeWithdrawals.forEach(
        (payNote: PayNote) => {
          if (payNote.blockNumber <= readyBlock) {
            this.hasVerifiedWithdrawals = true;
          }
        }
      );
    }
  }

  ngOnInit(): void {

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

  fromDecimals(val: number): string {
    return tbn(val).div(1e18).toFixed(8).toString();
  }
}
