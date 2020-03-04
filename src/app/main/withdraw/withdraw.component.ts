import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { tw } from 'zeropool-lib';
import { getEthAddressSafe } from '../../services/web3.provider.service';
import { environment } from '../../../environments/environment';
import { TransactionService } from '../../services/transaction.service';
import { catchError, tap } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-withdraw',
  templateUrl: './withdraw.component.html',
  styleUrls: ['./withdraw.component.scss']
})
export class WithdrawComponent implements OnInit {

  progressMessageLineTwo: string;
  progressMessageLineOne: string;
  isLineTwoBold: boolean;

  transactionHash: string;

  myZpBalance: number;

  isDone = false;
  isDoneWithError: boolean;
  withdrawIsInProgress = false;

  public transferForm: FormGroup = this.fb.group({
    toAmount: [''],
    toAddress: new FormControl('', [
      // Validators.required,
      // ValidateMnemonic
    ])
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
    const a = getEthAddressSafe();
    this.transferForm.get('toAddress').setValue(a.replace('0x', ''));
  }

  onSendClick(): void {
    this.withdrawIsInProgress = true;

    const amount = tw(this.toAmount).toNumber();

    this.txService.prepareWithdraw(environment.ethToken, amount, environment.relayerFee, (progressStep) => {
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
        this.withdrawIsInProgress = false;
        this.isDone = true;
        console.log({
          prepareWithdraw: txHash
        });
      }),
      catchError((e) => {
        this.withdrawIsInProgress = false;
        this.isDoneWithError = true;

        console.log(e);
        return of('');
      })
    ).subscribe();

  }

}
