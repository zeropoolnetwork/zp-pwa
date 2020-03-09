import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { tw } from 'zeropool-lib';
import { TransactionService } from '../../services/transaction.service';
import { catchError, tap } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-gas-deposit',
  templateUrl: './gas-deposit.component.html',
  styleUrls: ['./gas-deposit.component.scss']
})
export class GasDepositComponent implements OnInit {

  isDone = false;
  isDoneWithError = false;
  inProgress = false;

  progressMessageLineOne: string;
  progressMessageLineTwo: string;
  isLineTwoBold = true;

  form: FormGroup = this.fb.group({
    toAmount: ['', Validators.max(0.1)],
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

    const progressCallback = (progressStep) => {
      if (progressStep === 'wait-for-zp-block') {
        this.progressMessageLineOne = 'Transaction published';
        this.progressMessageLineTwo = 'Wait for ZeroPool block';
        this.isLineTwoBold = false;
      }
    };

    this.progressMessageLineOne = 'Transaction generated';
    this.progressMessageLineTwo = 'Please check your metamask';
    this.isLineTwoBold = true;

    // progressCallback
    this.txService.gasDeposit(amount, progressCallback).pipe(
      tap((txHash: string) => {
        this.inProgress = false;
        this.isDone = true;
        console.log({gasDeposit: txHash});
      }),
      catchError((e) => {
        this.inProgress = false;
        this.isDoneWithError = true;
        console.log(e);
        return of(e);
      })
    ).subscribe();

  }
}
