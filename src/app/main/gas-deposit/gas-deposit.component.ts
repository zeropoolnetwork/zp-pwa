import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { tw } from 'zeropool-lib';
import { TransactionService } from '../../services/transaction/transaction.service';
import { catchError, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TransactionSynchronizer } from '../../services/transaction/transaction-synchronizer';

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

    const progressCallback = (progressStep) => {
      if (progressStep === 'wait-for-zp-block') {
        this.progressMessageLineOne = 'Transaction published';
        this.progressMessageLineTwo = 'Wait for ZeroPool block';
        this.isLineTwoBold = false;
      } else if (progressStep === 'queue') {
        this.progressMessageLineOne = 'Wait until the last transactions are confirmed';
        // this.progressMessageLineTwo = 'Wait for ZeroPool block';
        // this.isLineTwoBold = true;
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
