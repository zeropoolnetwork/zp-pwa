import { Component, OnInit } from '@angular/core';
import { AccountService, IAccount } from '../services/account.service';
import { ZeroPoolService } from '../services/zero-pool.service';
import { Observable, timer } from 'rxjs';
import { fw, tbn, HistoryItem } from 'zeropool-lib';
import { copyToClipboard } from '../copy-to-clipboard';
import { MatTooltip } from '@angular/material/tooltip';
import { delay, filter, tap } from 'rxjs/operators';
import { Web3ProviderService } from '../services/web3.provider.service';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit {

  account$: Observable<IAccount>;

  isConnectedEthereum: boolean;

  balance;
  history: HistoryItem[];
  tooltipMessage = 'Copy to clipboard';

  constructor(
    private accountSvc: AccountService,
    private zpService: ZeroPoolService,
    private web3Service: Web3ProviderService,
    private clipboard: Clipboard
  ) {

    this.isConnectedEthereum = !!(zpService.zp
      && zpService.zp.ZeroPool.web3Ethereum.ethAddress);

    web3Service.isReady$.pipe(
      filter(x => !!x)
    )
      .subscribe(
        () => {
          this.isConnectedEthereum = true;
        }
      );

    this.account$ = this.accountSvc.account$;

    this.zpService.balanceProgressNotificator$.subscribe((update) => {
      console.log(update);
    });

    const ethAssetId = '0x0';

    if (this.zpService.zpBalance) {
      this.balance = fw(this.zpService.zpBalance[ethAssetId]) || 0;
      this.history = this.zpService.zpHistory;
    }

    this.zpService.zpUpdates$.subscribe(() => {
      this.balance = fw(this.zpService.zpBalance[ethAssetId]) || 0;
      this.history = this.zpService.zpHistory;
    });

  }

  connectWallet() {
    this.web3Service.connectWeb3();
  }

  ngOnInit(): void {

  }

  copyAddress(address: string): void {
    copyToClipboard(address);
  }

  onAddressClick(tooltip: MatTooltip, account: IAccount) {

    tooltip.hide();
    this.copyAddress(account.zeropoolAddress);

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
