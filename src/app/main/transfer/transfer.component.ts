import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { fromPromise } from 'rxjs/internal-compatibility';
import { mergeMap, tap } from 'rxjs/operators';
import { tw, Tx } from 'zeropool-lib';
import { ZeroPoolService } from '../../services/zero-pool.service';
import { environment } from '../../../environments/environment';
import { RelayerApiService } from '../../services/relayer.api.service';
import { combineLatest, of } from 'rxjs';
import { Transaction } from 'web3-core';

@Component({
  selector: 'app-transfer',
  templateUrl: './transfer.component.html',
  styleUrls: ['./transfer.component.scss']
})
export class TransferComponent implements OnInit {

  transactionHash: string;

  myZpBalance: number;

  isDone = false;
  transferIsInProgress = false;

  public transferForm: FormGroup = this.fb.group({
    toAmount: [''],
    toAddress: ['']
  });

  get toAmount(): number {
    return this.transferForm.get('toAmount').value;
  }

  get toAddress(): string {
    return this.transferForm.get('toAddress').value;
  }

  constructor(
    private fb: FormBuilder,
    private zpService: ZeroPoolService,
    private relayerApi: RelayerApiService
  ) {
  }

  ngOnInit(): void {
    //
  }

  onSendClick(): void {
    this.transferIsInProgress = true;

    const amount = tw(this.toAmount).toNumber();

    fromPromise(this.zpService.zp.transfer(environment.ethToken, this.toAddress, amount))
      .pipe(
        mergeMap(
          ([tx, txHash]: [Tx<string>, string]) => {
            const gasTx$ = fromPromise(this.zpService.zpGas.prepareWithdraw(environment.ethToken, environment.relayerFee));
            const tx$ = of(tx);
            return combineLatest([tx$, gasTx$]);
          }
        ),
        mergeMap(
          ([tx, gasTx]: [Tx<string>, [Tx<string>, string]]) => {
            return this.relayerApi.sendTx$(tx, 0, gasTx[0]);
          }
        )
      ).subscribe(
      (transaction: any) => {
        this.isDone = true;
        console.log(transaction.transactionHash);
      }
    );

  }

}
