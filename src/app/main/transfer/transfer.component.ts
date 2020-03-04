import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { tw } from 'zeropool-lib';
import { environment } from '../../../environments/environment';
import { TransactionService } from '../../services/transaction.service';
import { catchError, tap } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-transfer',
  templateUrl: './transfer.component.html',
  styleUrls: ['./transfer.component.scss']
})
export class TransferComponent implements OnInit {

  progressMessageLineTwo: string;
  progressMessageLineOne: string;
  isLineTwoBold: boolean;

  transactionHash: string;

  myZpBalance: number;

  isDone = false;
  isDoneWithError = false;
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
    private txService: TransactionService
  ) {
  }

  ngOnInit(): void {
    //
  }

  onSendClick(): void {
    this.transferIsInProgress = true;

    const amount = tw(this.toAmount).toNumber();

    this.txService.transfer(environment.ethToken, this.toAddress, amount, environment.relayerFee, (progressStep) => {
      if (progressStep === 'generate-zp-tx') {
        this.progressMessageLineOne = 'Generating Zero Pool Transaction';
        this.progressMessageLineTwo = 'It will take a bit';
        // this.isLineTwoBold = true;
      } else if (progressStep === 'wait-for-zp-block') {
        this.progressMessageLineOne = 'Transaction published';
        this.progressMessageLineTwo = 'Wait for ZeroPool block';
        this.isLineTwoBold = true;
      }

    }).pipe(
      tap((txHash: any) => {
        this.transferIsInProgress = false;
        this.isDone = true;
        console.log({
          transfer: txHash
        });
      }),
      catchError((e) => {
        this.transferIsInProgress = false;
        this.isDoneWithError = true;

        console.log(e);
        return of('');
      })
    ).subscribe();
  }

}
