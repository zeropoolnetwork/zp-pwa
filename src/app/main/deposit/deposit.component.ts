import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { Location } from '@angular/common';
import { ZeroPoolService } from '../../services/zero-pool.service';
import { tw } from 'zeropool-lib';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { environment } from '../../../environments/environment';
import { of } from 'rxjs';
import { TransactionService } from '../../services/transaction.service';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { AmountValidatorParams, CustomValidators } from '../gas-deposit/custom-validators';
import { Web3ProviderService } from '../../services/web3.provider.service';
import { UnconfirmedTransactionService } from '../../services/unconfirmed-transaction.service';
import { ProgressMessageComponent } from '../progress-message/progress-message.component';

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

  @ViewChild('progressDialog')
  progressDialog: ProgressMessageComponent;


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

    this.web3Service.isReady$.pipe(
      switchMap(
        () => this.web3Service.getEthBalance()
      ),
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

    this.progressDialog.showMessage({
      title: 'Deposit in progress',
      lineOne: 'Generate ZeroPool transaction',
      lineTwo: 'It might take some time'
    });

    const amount = tw(this.amount.value).toNumber();

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
        UnconfirmedTransactionService.deleteDepositTransaction();
      }),
      catchError((e) => {
        this.depositInProgress = false;
        this.isFinishedWithError = true;
        UnconfirmedTransactionService.deleteDepositTransaction();
        console.log(e);
        return of('');
      }),
    ).subscribe();
  }

}
