import { Component, Input, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { ZeroPoolService } from '../../zero-pool.service';
import { BlockItem, tw } from 'zeropool-lib';
import { Transaction } from 'web3-core';
import { mergeMap } from 'rxjs/operators';
import { fromPromise } from 'rxjs/internal-compatibility';
import { RelayerApiService } from '../../relayer.api.service';
import { FormBuilder, FormGroup } from '@angular/forms';

const ethToken = '0x0000000000000000000000000000000000000000';

@Component({
  selector: 'app-deposit',
  templateUrl: './deposit.component.html',
  styleUrls: ['./deposit.component.scss']
})
export class DepositComponent implements OnInit {

  @Input()
  availableEthAmount: number;

  transactionHash: string;

  isDone = false;
  depositInProgress = false;
  color = 'rgba(100, 100, 100, 0.5)';


  public depositForm: FormGroup = this.fb.group({
    amount: [''],
  });

  get depositAmount(): number {
    return this.depositForm.get('amount').value;
  }

  constructor(
    private location: Location,
    private zpService: ZeroPoolService,
    private relayerApi: RelayerApiService,
    private fb: FormBuilder
  ) {

    this.availableEthAmount = 0.0000;
  }

  ngOnInit(): void {
  }

  onDepositClick(): void {
    this.depositInProgress = true;
    this.zpService.activeZpNetwork$
      .pipe(
        mergeMap(
          zp => {
            const amount = tw(this.depositAmount).toNumber();

            // generate tx and send eth to contract
            return fromPromise(zp.deposit(ethToken, amount));
          }),
        mergeMap(
          ([blockItem, txHash]: [BlockItem<string>, string]) => {
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
