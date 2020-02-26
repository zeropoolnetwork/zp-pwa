import { Component } from '@angular/core';
import { CircomeLoaderService } from './circome-loader.service';
import { Observable } from 'rxjs';
import { AccountService, IAccount } from './account.service';
import { ZeroPoolService } from './zero-pool.service';
import { shareReplay, tap } from 'rxjs/operators';
import { Web3ProviderService } from './web3.provider.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'zp-ui';

  hasError$: Observable<boolean>;
  circomeResourcesLoaded$: Observable<boolean>;

  balance = 1;
  history = [
    {type: 'transfer', amount: 10},
    {type: 'deposit', amount: 10},
    {type: 'withdraw', amount: 10},
  ];

  ethAddress$: Observable<string>;

  constructor(
    private circomeSvc: CircomeLoaderService,
    private accountSvc: AccountService,
    private zeropoolSvc: ZeroPoolService,
    private web3Service: Web3ProviderService
  ) {
    this.hasError$ = this.circomeSvc.hasError$;
    this.circomeResourcesLoaded$ = this.circomeSvc.isReady$;

    this.ethAddress$ = this.web3Service.address$;
  }

  connectWallet() {
    this.web3Service.connectWeb3();
  }
}
