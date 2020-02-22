import { Injectable } from '@angular/core';
import { CircomeLoaderService } from './circome-loader.service';
import { ZeroPoolNetwork } from 'zeropool-lib';
import { filter, map, tap } from 'rxjs/operators';
import { AccountService } from './account.service';
import { environment } from '../environments/environment';
import { combineLatest, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ZeropoolService {

  activeZpNetwork$: Observable<ZeroPoolNetwork>;

  constructor(private circomeSvc: CircomeLoaderService, private accountService: AccountService) {

    // In order to get ethereum balance use:
    // activeZpNetwork.ZeroPool.web3Ethereum.getBalance('');

    const loaded$ = this.circomeSvc.isReady$.pipe(
      filter((isReady) => isReady),
    );

    this.activeZpNetwork$ = combineLatest([loaded$, this.accountService.account$]).pipe(
      map((x) => {
        const [_, account] = x;
        return new ZeroPoolNetwork(
          environment.contractAddress,
          account.ethereumPrivateKey,
          account.zeropoolMnemonic,
          this.circomeSvc.circomeTxJson,
          this.circomeSvc.proverKey,
          environment.ethereumRpc
        );
      }),
    );
  }
}
