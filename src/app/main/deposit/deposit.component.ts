import { AfterViewInit, Component, OnDestroy, ViewChild } from '@angular/core';
import { Location } from '@angular/common';
import { ZeroPoolService } from '../../services/zero-pool.service';
import { tw } from 'zeropool-lib';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { of, Subscription } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { AmountValidatorParams, CustomValidators } from '../gas-deposit/custom-validators';
import { Web3ProviderService } from '../../services/web3.provider.service';
import { depositProgress, depositProgress$, UnconfirmedTransactionService } from '../../services/unconfirmed-transaction.service';
import { TransactionService } from '../../services/transaction.service';
import { ProgressMessageComponent } from '../progress-message/progress-message.component';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-deposit',
  templateUrl: './deposit.component.html',
  styleUrls: ['./deposit.component.scss']
})
export class DepositComponent implements AfterViewInit, OnDestroy {

  availableEthAmount: number;

  transactionHash: string;

  isFinished = false;
  isFinishedWithError = false;

  depositInProgress = false;

  subscription: Subscription;

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
    return 10e-18;
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
    // Показывать что в процессе если уже зашел тудаы
    this.availableEthAmount = this.zpService.ethBalance;
  }

  ngAfterViewInit(): void {

    // Ethereum balances
    this.subscription = this.web3Service.isReady$.pipe(
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


    setTimeout(() => {
      // Handling case when subscription is already in progress
      if (UnconfirmedTransactionService.hasOngoingDepositTransaction()) {

        if (depositProgress.value) {
          this.depositInProgress = true;
          this.setProgressState(depositProgress.value);
        }

        const progress = depositProgress$.subscribe(
          (progressStep: string) => {
            progressStep && this.setProgressState(progressStep);
          },
          () => {
          },
          () => {
            this.depositInProgress = false;
            this.isFinished = true;
          }
        );

        this.subscription.add(progress);
      }
    });

  }

  private setProgressState(progressStep = 'start') {
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
        lineTwo: 'Verifying ZeroPool block',
        isLineTwoBold: true
      });
    } else if (progressStep === 'receipt-tx-data') {
      //
      this.progressDialog.showMessage({
        title: 'Deposit in progress',
        lineOne: 'Block successfully verified',
        lineTwo: 'Waiting for a transaction to be included in a block',
        isLineTwoBold: true
      });

    } else if (progressStep === 'queue') {
      //
      this.progressDialog.showMessage({
        title: 'Deposit in progress',
        lineOne: 'Wait for the last transactions to be confirmed',
        lineTwo: '',
        isLineTwoBold: true
      });

    } else if (progressStep === 'start') {
      this.progressDialog.showMessage({
        title: 'Deposit in progress',
        lineOne: 'Generate ZeroPool transaction',
        lineTwo: 'It might take some time'
      });
    } else if (progressStep === 'unconfirmed-deposit-start') {
      this.progressDialog.showMessage({
        title: 'Deposit in progress',
        lineOne: 'Transaction generated',
        lineTwo: 'Wait for deposit confirmation on chain',
        isLineTwoBold: true
      });
    }

  }

  ngOnDestroy(): void {
    this.subscription && this.subscription.unsubscribe();
  }

  onDepositClick(): void {
    this.depositInProgress = true;

    this.setProgressState();

    const amount = tw(this.amount.value).toNumber();

    const progressCallback = (progressStep) => {
      this.setProgressState(progressStep);
    };

    // Generate ZeroPool transaction

    this.txService.deposit(environment.ethToken, amount, environment.relayerFee, progressCallback).pipe(
      tap((txHash: any) => {
        this.depositInProgress = false;
        this.isFinished = true;

        console.log({
          deposit: txHash
        });

        // TODO: check with Kiril shell we call delete from component code
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

