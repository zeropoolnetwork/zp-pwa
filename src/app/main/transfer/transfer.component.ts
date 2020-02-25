import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { fromPromise } from 'rxjs/internal-compatibility';
import { Transaction } from 'web3-core';
import { mergeMap } from 'rxjs/operators';
import { BlockItem, tw } from 'zeropool-lib';
import { ZeroPoolService } from '../../zero-pool.service';
import { environment } from '../../../environments/environment';
import { RelayerApiService } from '../../relayer.api.service';

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
  }

  onSendClick() {
    this.transferIsInProgress = true;
    fromPromise(this.zpService.zp$).pipe(
      mergeMap((zp) => {
        const amount = tw(this.toAmount).toNumber();

        // generate tx and send eth to contract
        return fromPromise(zp.transfer(environment.ethToken, this.toAddress, amount));
      }),
      mergeMap((blockItem: BlockItem<string>) => {
          return this.relayerApi.sendTx$(blockItem);
        }
      )
    ).subscribe(
      (tx: Transaction) => {
        this.isDone = true;
        this.transactionHash = tx.transactionHash;
      }
    );
  }
}
