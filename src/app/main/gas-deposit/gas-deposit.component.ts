import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { tw } from 'zeropool-lib';
import { TransactionService } from '../../services/transaction.service';

@Component({
  selector: 'app-gas-deposit',
  templateUrl: './gas-deposit.component.html',
  styleUrls: ['./gas-deposit.component.scss']
})
export class GasDepositComponent implements OnInit {

  isDone = false;
  inProgress = false;

  form: FormGroup = this.fb.group({
    toAmount: [''],
    // toAddress: ['']
  });

  get depositAmount(): number {
    return this.form.get('toAmount').value;
  }

  constructor(
    private fb: FormBuilder,
    private txService: TransactionService
  ) {
  }

  ngOnInit(): void {
  }

  depositGas() {
    this.inProgress = true;

    const amount = tw(this.depositAmount).toNumber();

    this.txService.gasDeposit(amount).subscribe(
      (txHash: string) => {
        this.inProgress = false;
        this.isDone = true;

        console.log({ gasDeposit: txHash });
      }
    );

  }
}
