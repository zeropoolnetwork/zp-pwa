import { Component } from '@angular/core';
import { CircomeLoaderService } from './circome-loader.service';
import { Observable } from 'rxjs';
import { AccountService, toAddressPreview } from './account.service';
import { ZeroPoolService } from './zero-pool.service';
import { Web3ProviderService } from './web3.provider.service';
import { map } from 'rxjs/operators';

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
}
