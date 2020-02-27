import { Component, OnInit } from '@angular/core';
import { AccountService, IAccount } from '../account.service';
import { ZeroPoolService } from '../zero-pool.service';
import { Observable } from 'rxjs';
import { fw, HistoryItem } from 'zeropool-lib';
import { copyToClipboard } from '../copy-to-clipboard';
import { MatSnackBar, MatSnackBarHorizontalPosition, MatSnackBarVerticalPosition } from '@angular/material/snack-bar';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit {

  account$: Observable<IAccount>;
  balance;
  history: HistoryItem[];

  horizontalPosition: MatSnackBarHorizontalPosition = 'center';
  verticalPosition: MatSnackBarVerticalPosition = 'top';

  constructor(private accountSvc: AccountService, private zpService: ZeroPoolService, private snackBar: MatSnackBar) {
    this.account$ = this.accountSvc.account$;

    this.zpService.balanceProgressNotificator$.subscribe((update) => {
      console.log(update);
    });

    if (this.zpService.zpBalance) {
      this.balance = fw(this.zpService.zpBalance['0x0']) || 0;
      this.history = this.zpService.zpHistory;
    }

    this.zpService.zpUpdates$.subscribe(() => {
      this.balance = fw(this.zpService.zpBalance['0x0']) || 0;
      this.history = this.zpService.zpHistory;
    });

  }

  ngOnInit(): void {

  }

  copyAddress(address: string): void {
    copyToClipboard(address);
  }

  private openSnackBar(message: string, action: string) {
    const config = {
      duration: 800,
      verticalPosition: this.verticalPosition,
      horizontalPosition: this.horizontalPosition,
    };

    this.snackBar.open(message, action, config);
  }
}
