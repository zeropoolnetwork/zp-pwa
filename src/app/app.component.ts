import { Component } from '@angular/core';
import { CircomeLoaderService } from './circome-loader.service';
import { Observable } from 'rxjs';
import { AccountService, IAccount } from './account.service';
import { ZeropoolService } from './zeropool.service';
import { switchMap } from 'rxjs/operators';
import { fromPromise } from 'rxjs/internal-compatibility';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'zp-ui';

  hasError$: Observable<boolean>;
  circomeResourcesLoaded$: Observable<boolean>;

  account$: Observable<IAccount>;
  balance = 1;
  history = [
    {type: 'transfer', amount: 10},
    {type: 'deposit', amount: 10},
    {type: 'withdraw', amount: 10},
  ];

  constructor(private circomeSvc: CircomeLoaderService, private accountSvc: AccountService, private zeropoolSvc: ZeropoolService) {
    this.hasError$ = this.circomeSvc.hasError$;
    this.circomeResourcesLoaded$ = this.circomeSvc.isReady$;

    this.account$ = this.accountSvc.account$;
  }

  connectWallet() {
    // TODO: use connect widget
  }

  deposit() {
    this.zeropoolSvc.activeZpNetwork$.pipe(
      switchMap((zpn) => {
        return fromPromise(zpn.deposit('0x0000000000000000000000000000000000000000', 100000));
      })
    ).subscribe((result) => {
    });
  }

  transfer() {

  }

  withdraw() {

  }
}
