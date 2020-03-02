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
  selector: 'app-gas-is-needed',
  templateUrl: './gas-is-needed.component.html',
  // styleUrls: ['./gas-is-needed.component.scss']
})
export class GasIsNeededComponent implements OnInit {

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

  }

  depositGas() {
    //
  }
}
