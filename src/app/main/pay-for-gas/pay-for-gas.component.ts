import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Location } from '@angular/common';
import { ZeroPoolService } from '../../services/zero-pool.service';
import { RelayerApiService } from '../../services/relayer.api.service';
import { BlockItem, tw } from 'zeropool-lib';
import { fromPromise } from 'rxjs/internal-compatibility';
import { environment } from '../../../environments/environment';
import { mergeMap } from 'rxjs/operators';
import { Transaction } from 'web3-core';

@Component({
  selector: 'app-pay-for-gas',
  templateUrl: './pay-for-gas.component.html',
  styleUrls: ['./pay-for-gas.component.scss']
})
export class PayForGasComponent implements OnInit {

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

    const amount = tw(this.depositAmount).toNumber();

    // generate tx and send eth to contract
    fromPromise(this.zpService.zp.deposit(environment.ethToken, amount)).pipe(
      mergeMap((blockItem: BlockItem<string>) => {
          return this.relayerApi.sendTx$(blockItem);
        }
      )
    ).subscribe(
      (tx: any) => {
      // (tx: Transaction) => {
        this.isDone = true;
        this.transactionHash = tx.transactionHash;
      }
    );
  }

}
