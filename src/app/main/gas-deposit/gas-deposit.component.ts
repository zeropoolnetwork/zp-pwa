import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { tw } from 'zeropool-lib';
import { TransactionService } from '../../services/transaction.service';
import { catchError, switchMap, take, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { ZeroPoolService } from '../../services/zero-pool.service';
import { AmountValidatorParams, CustomValidators } from './custom-validators';
import { Web3ProviderService } from '../../services/web3.provider.service';

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

  // objectValues = Object.values;

  get maxEth(): number {
    return 0.1;
  }

  get minEth(): number {
    return 0.00001;
  }

  get amountValidatorParams(): AmountValidatorParams {
    return {
      maxAmount: this.maxEth,
      minAmount: this.minEth,
    };
  }

  form: FormGroup = this.fb.group({
    amount: ['', [
      Validators.required,
      CustomValidators.amount(this.amountValidatorParams)]
    ]
  });

  get amount(): AbstractControl {
    return this.form.get('amount');
  }

  constructor(
    private fb: FormBuilder,
    private txService: TransactionService,
    private zpService: ZeroPoolService,
    private web3Service: Web3ProviderService
  ) {
    //
  }

  ngOnInit(): void {

    // It observable because it could be open when main isn't loaded yet
    this.web3Service.isReady$.pipe(
      switchMap(() => {
        return this.web3Service.getEthBalance();
      }),
      tap(
        (ethBalance: number) => {

          // new validator
          const amountValidatorParams = {
            ...this.amountValidatorParams,
            availableAmount: ethBalance,
          };

          const amountValidator = CustomValidators.amount(amountValidatorParams);
          this.amount.setValidators([Validators.required, amountValidator]);
          this.form.get('amount').updateValueAndValidity();
        }
      ),
      take(1)
    ).subscribe();
  }

  depositGas() {
    this.inProgress = true;

    const amount = tw(this.amount.value).toNumber();

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
