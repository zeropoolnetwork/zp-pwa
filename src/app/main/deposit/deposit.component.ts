import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { Location } from '@angular/common';
import { ZeroPoolService } from '../../services/zero-pool.service';
import { tw } from 'zeropool-lib';
import { FormBuilder, FormGroup } from '@angular/forms';
import { environment } from '../../../environments/environment';
import { of } from 'rxjs';
import { TransactionService } from '../../services/transaction.service';
import { catchError, tap } from 'rxjs/operators';
import { ProgressMessageComponent } from '../progress-message/progress-message.component';

@Component({
  selector: 'app-deposit',
  templateUrl: './deposit.component.html',
  styleUrls: ['./deposit.component.scss']
})
export class DepositComponent implements AfterViewInit {

  availableEthAmount: number;

  transactionHash: string;

  isFinished = false;
  isFinishedWithError = false;

  depositInProgress = false;

  @ViewChild('progressDialog')
  progressDialog: ProgressMessageComponent;


  public form: FormGroup = this.fb.group({
    amount: [''],
  });

  get depositAmount(): number {
    return this.form.get('amount').value;
  }

  constructor(
    private location: Location,
    private zpService: ZeroPoolService,
    private txService: TransactionService,
    private fb: FormBuilder
  ) {

    this.availableEthAmount = this.zpService.ethBalance;
  }

  ngAfterViewInit(): void {
    //debugger
    //setTimeout(() => {
    //   this.progressDialog.showMessage({
    //     title: 'Deposit in progress',
    //     lineOne: ''
    //   });
    //}, 1000)

  }

  onDepositClick(): void {
    this.depositInProgress = true;

    this.progressDialog.showMessage({
      title: 'Deposit in progress',
      lineOne: 'Generate ZeroPool transaction',
      lineTwo: 'It might take some time'
    });

    const amount = tw(this.depositAmount).toNumber();

    // Generate ZeroPool transaction

    this.txService.deposit(environment.ethToken, amount, environment.relayerFee, (progressStep) => {
      if (progressStep === 'open-metamask') {
        this.progressDialog.showMessage({
          title: 'Deposit in progress',
          lineOne: 'Transaction generated',
          lineTwo: 'Please check your metamask',
          isLineTwoBold: true
        });
      } else if (progressStep === 'sending-transaction') {
        this.progressDialog.showMessage({
          title: 'Deposit in progress',
          lineOne: 'Transaction generated',
          lineTwo: 'Wait for ZeroPool block',
          isLineTwoBold: true
        });
      }

    }).pipe(
      tap((txHash: any) => {
        this.depositInProgress = false;
        this.isFinished = true;
        console.log({
          deposit: txHash
        });
      }),
      catchError((e) => {
        this.depositInProgress = false;
        this.isFinishedWithError = true;

        console.log(e);
        return of('');
      }),
    ).subscribe();
  }

}
