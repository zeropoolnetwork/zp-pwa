import { Component, OnInit } from '@angular/core';
import { CircomeLoaderService } from './services/circome-loader.service';
import { interval, Observable } from 'rxjs';
import { AccountService, toAddressPreview } from './services/account.service';
import { ZeroPoolService } from './services/zero-pool.service';
import { Web3ProviderService } from './services/web3.provider.service';
import { map, tap } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'zp-ui';

  hasError$: Observable<boolean>;
  circomeResourcesLoaded$: Observable<boolean>;

  balance = 1;
  history = [
    {type: 'transfer', amount: 10},
    {type: 'deposit', amount: 10},
    {type: 'withdraw', amount: 10},
  ];

  ethAddress$: Observable<{ full: string, short: string }>;

  constructor(
    private circomeSvc: CircomeLoaderService,
    private accountSvc: AccountService,
    private zeropoolSvc: ZeroPoolService,
    private web3Service: Web3ProviderService
  ) {
    this.hasError$ = this.circomeSvc.hasError$;
    this.circomeResourcesLoaded$ = this.circomeSvc.isReady$;

    this.ethAddress$ = this.web3Service.address$.pipe(
      map((ethAddress: string) => {
        return {
          full: ethAddress, short: toAddressPreview(ethAddress)
        };
      })
    );
  }

  connectWallet() {
    this.web3Service.connectWeb3();
  }

  ngOnInit(): void {
    interval(1000).pipe(
      tap(() => {
        //this.web3Service.refreshWeb3ConnectionState();
      })
    ).subscribe();
    // Do refresh after component initialisation

  }
}
