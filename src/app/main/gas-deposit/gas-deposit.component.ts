import {Component, OnInit, ViewChild} from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { tw } from 'zeropool-lib';
import { TransactionService } from '../../services/transaction.service';
import { catchError, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import {ProgressMessageComponent} from '../progress-message/progress-message.component';

@Component({
  selector: 'app-gas-deposit',
  templateUrl: './gas-deposit.component.html',
  styleUrls: ['./gas-deposit.component.scss']
})
export class GasDepositComponent implements OnInit {

  isDone = false;
  isDoneWithError = false;
  inProgress = false;

  @ViewChild('progressDialog')
  progressDialog: ProgressMessageComponent;

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
        this.progressDialog.showMessage({
          title: 'Gas deposit in progress',
          lineOne: 'Transaction published',
          lineTwo: 'Wait for ZeroPool block'
        });
      }
    };

    this.progressDialog.showMessage({
      title: 'Gas deposit in progress',
      lineOne: 'Transaction generated',
      lineTwo: 'Please check your metamask',
      isLineTwoBold: true
    });

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
