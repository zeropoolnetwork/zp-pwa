import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Component, OnInit, ViewChild } from '@angular/core';
import { tw } from 'zeropool-lib';
import { catchError, switchMap, take, tap } from 'rxjs/operators';
import { TransactionService } from '../../services/transaction.service';
import { of } from 'rxjs';
import { ZeroPoolService } from '../../services/zero-pool.service';
import { AmountValidatorParams, CustomValidators } from './custom-validators';
import { Web3ProviderService } from '../../services/web3.provider.service';
import { ProgressMessageComponent } from '../progress-message/progress-message.component';
import { UnconfirmedTransactionService } from '../../services/unconfirmed-transaction.service';
import { ActionList, StepList } from '../progress-message/transaction-progress';
import { environment } from '../../../environments/environment';

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
    this.zpService.start$.subscribe();
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

    const progressCallback = (progressStep: StepList, txHash?: string) => {
      if (txHash) {
        txHash = progressStep === StepList.START_ETH_TRANSACTION
          ? environment.etherscanPrefix + txHash
          : environment.etherscanSideChainPrefix + txHash;
      }

      const action = ActionList.GAS_DEPOSIT;
      this.progressDialog.showMessage(action, progressStep, txHash);
    };

    // progressCallback
    this.txService.gasDeposit(amount, progressCallback).pipe(
      tap((txHash: string) => {
        this.inProgress = false;
        this.isDone = true;
        console.log({ gasDeposit: txHash });
        UnconfirmedTransactionService.deleteGasDepositTransaction();
      }),
      catchError((e) => {
        this.inProgress = false;
        this.isDoneWithError = true;
        console.log(e);
        UnconfirmedTransactionService.deleteGasDepositTransaction();
        return of(e);
      })
    ).subscribe();

  }
}
