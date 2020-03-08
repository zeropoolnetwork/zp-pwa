import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { ZeroPoolService } from '../../services/zero-pool.service';
import { tw } from 'zeropool-lib';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { environment } from '../../../environments/environment';
import { of } from 'rxjs';
import { TransactionService } from '../../services/transaction.service';
import { catchError, tap } from 'rxjs/operators';
import { AmountValidatorParams, CustomValidators } from '../gas-deposit/custom-validators';
import { Web3ProviderService } from '../../services/web3.provider.service';

@Component({
  selector: 'app-deposit',
  templateUrl: './deposit.component.html',
  styleUrls: ['./deposit.component.scss']
})
export class DepositComponent implements OnInit {

  availableEthAmount: number;

  transactionHash: string;

  isFinished = false;
  isFinishedWithError = false;

  depositInProgress = false;
  progressMessageLineOne = '';
  progressMessageLineTwo = '';
  isLineTwoBold = false;
  color = 'rgba(100, 100, 100, 0.5)';


  public form: FormGroup = this.fb.group({
    amount: ['', Validators.max(0.1)], // Min, Balance
  });

  get amount(): AbstractControl {
    return this.form.get('amount');
  }

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

  constructor(
    private location: Location,
    private zpService: ZeroPoolService,
    private txService: TransactionService,
    private web3Service: Web3ProviderService,
    private fb: FormBuilder
  ) {

    this.availableEthAmount = this.zpService.ethBalance;
  }

  ngOnInit(): void {

    this.web3Service.getEthBalance().pipe(
      tap((ethBalance: number) => {
        const amountValidatorParams = {
          ...this.amountValidatorParams,
          availableAmount: ethBalance,
        };

        const amountValidator = CustomValidators.amount(amountValidatorParams);
        this.amount.setValidators([Validators.required, amountValidator]);
        this.form.get('amount').updateValueAndValidity();
      })
    ).subscribe();
  }

  onDepositClick(): void {

    this.depositInProgress = true;
    this.progressMessageLineOne = 'Generate ZeroPool transaction';
    this.progressMessageLineTwo = 'It might take some time';
    this.isLineTwoBold = false;

    const amount = tw(this.amount.value).toNumber();

    // Generate ZeroPool transaction

    this.txService.deposit(environment.ethToken, amount, environment.relayerFee, (progressStep) => {
      if (progressStep === 'open-metamask') {
        this.progressMessageLineOne = 'Transaction generated';
        this.progressMessageLineTwo = 'Please check your metamask';
        this.isLineTwoBold = true;
      } else if (progressStep === 'sending-transaction') {
        this.progressMessageLineOne = 'Transaction published';
        this.progressMessageLineTwo = 'Wait for ZeroPool block';
        this.isLineTwoBold = true;
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
