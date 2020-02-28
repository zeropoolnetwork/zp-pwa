import { Component, OnInit } from '@angular/core';
import { AccountService, IAccount } from '../account.service';
import { ZeroPoolService } from '../zero-pool.service';
import { Observable, timer } from 'rxjs';
import { fw, HistoryItem } from 'zeropool-lib';
import { copyToClipboard } from '../copy-to-clipboard';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltip } from '@angular/material/tooltip';
import { delay, tap } from 'rxjs/operators';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit {

  account$: Observable<IAccount>;
  balance;
  history: HistoryItem[];
  tooltipMessage = 'Copy to clipboard';

  constructor(private accountSvc: AccountService, private zpService: ZeroPoolService, private snackBar: MatSnackBar) {
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

  ngOnInit(): void {

  }

  copyAddress(address: string): void {
    copyToClipboard(address);
  }


  // horizontalPosition: MatSnackBarHorizontalPosition = 'center';
  // verticalPosition: MatSnackBarVerticalPosition = 'top';
  // private openSnackBar(message: string, action: string) {
  //   const config = {
  //     duration: 800,
  //     verticalPosition: this.verticalPosition,
  //     horizontalPosition: this.horizontalPosition,
  //   };
  //
  //   this.snackBar.open(message, action, config);
  // }

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
}
