import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Location } from '@angular/common';
import { ZeroPoolService } from '../../services/zero-pool.service';
import { RelayerApiService } from '../../services/relayer.api.service';

@Component({
  selector: 'app-gas-is-needed',
  templateUrl: './gas-is-needed.component.html',
  // styleUrls: ['./gas-is-needed.component.scss']
})
export class GasIsNeededComponent implements OnInit {

  @Input()
  availableEthAmount: number;

  transactionHash: string;
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
