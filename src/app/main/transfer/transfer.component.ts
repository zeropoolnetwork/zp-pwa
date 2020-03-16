import { Component, OnInit, ViewChild } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { fw, tw } from 'zeropool-lib';
import { environment } from '../../../environments/environment';
import { TransactionService } from '../../services/transaction.service';
import { catchError, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { ZeroPoolService } from '../../services/zero-pool.service';
import { ValidateAddress } from '../../common/validateAddress';
import { ProgressMessageComponent } from '../progress-message/progress-message.component';
import { ActionList, StepList } from '../progress-message/transaction-progress';

@Component({
  selector: 'app-transfer',
  templateUrl: './transfer.component.html',
  styleUrls: ['./transfer.component.scss']
})
export class TransferComponent implements OnInit {

  transactionHash: string;

  myZpBalance: number;
  minAmount = 1e-18;

  isDone = false;
  isDoneWithError = false;
  transferIsInProgress = false;

  @ViewChild('progressDialog')
  progressDialog: ProgressMessageComponent;

  public form: FormGroup = this.fb.group({
    toAmount: new FormControl('', [Validators.required]),
    toAddress: new FormControl('', [Validators.required, ValidateAddress]),
  });

  get toAmount(): AbstractControl {
    return this.form.get('toAmount');
  }

  get toAddress(): AbstractControl {
    return this.form.get('toAddress');
  }

  constructor(
    private fb: FormBuilder,
    private txService: TransactionService,
    private zpService: ZeroPoolService,
  ) {
  }

  ngOnInit(): void {
    const ethAssetId = environment.ethToken;
    this.myZpBalance = fw(this.zpService.zpBalance[ethAssetId]) || 0;

    // Adjust max value to validates
    this.form.get('toAmount').setValidators([
      Validators.required,
      Validators.min(this.minAmount),
      Validators.max(this.myZpBalance)
    ]);

    // this.zpService.zpUpdates$.pipe(
    //   tap(() => {
    //     this.zpService.maxAmountToSend
    //   })
    // );

    this.form.get('toAmount').updateValueAndValidity();

  }

  private setProgressState(progressStep: StepList, txHash?: string) {
    if (txHash) {
      txHash = environment.etherscanPrefix + txHash;
    }

    const action = ActionList.TRANSFER;
    this.progressDialog.showMessage(action, progressStep, txHash);
  }

  onSendClick(): void {
    this.transferIsInProgress = true;

    this.setProgressState(StepList.GENERATE_TRANSACTION);

    const address = this.toAddress.value;
    const amount = tw(this.toAmount.value).toNumber();
    const progressCallback = (progressStep: StepList, txHash?: string) => this.setProgressState(progressStep, txHash);

    this.txService.transfer(environment.ethToken, address, amount, environment.relayerFee, progressCallback).pipe(
      tap((txHash: any) => {
        this.transferIsInProgress = false;
        this.isDone = true;
        console.log({
          transfer:  txHash
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

  fillMax(max: number) {
    this.toAmount.setValue(max);
  }
}
