import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { fw, tw } from 'zeropool-lib';
import { environment } from '../../../environments/environment';
import { TransactionService } from '../../services/transaction.service';
import { catchError, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { ZeroPoolService } from '../../services/zero-pool.service';
import { ValidateAddress } from '../../common/validateAddress';
import { ProgressMessageComponent } from '../progress-message/progress-message.component';

@Component({
  selector: 'app-transfer',
  templateUrl: './transfer.component.html',
  styleUrls: ['./transfer.component.scss']
})
export class TransferComponent implements AfterViewInit {

  transactionHash: string;

  myZpBalance: number;

  isDone = false;
  isDoneWithError = false;
  transferIsInProgress = false;

  @ViewChild('progressDialog')
  progressDialog: ProgressMessageComponent;

  public form: FormGroup = this.fb.group({
    toAmount: new FormControl('', [Validators.required]),
    toAddress: new FormControl('', [Validators.required, ValidateAddress]),
  });

  get toAmount(): number {
    return this.form.get('toAmount').value;
  }

  get toAddress(): string {
    return this.form.get('toAddress').value;
  }

  constructor(
    private fb: FormBuilder,
    private txService: TransactionService,
    private zpService: ZeroPoolService
  ) {
  }

  ngAfterViewInit(): void {

    const ethAssetId = '0x0';
    this.myZpBalance = fw(this.zpService.zpBalance[ethAssetId]) || 0;

    // Adjust max value to validates
    this.form.get('toAmount').setValidators([
      Validators.required,
      Validators.min(0),
      Validators.max(this.myZpBalance)
    ]);
    this.form.get('toAmount').updateValueAndValidity();
  }

  onSendClick(): void {
    this.transferIsInProgress = true;

    const amount = tw(this.toAmount).toNumber();
    const progressCallback = (progressStep) => {
      if (progressStep === 'generate-zp-tx') {
        this.progressDialog.showMessage({
          title: 'Transfer is in progress',
          lineOne: 'Generating Zero Pool Transaction',
          lineTwo: 'It will take a bit'
          // isLineTwoBold: true
        });
      } else if (progressStep === 'wait-for-zp-block') {
        this.progressDialog.showMessage({
          title: 'Transfer is in progress',
          lineOne: 'Transaction published',
          lineTwo: 'Wait for ZeroPool block',
          isLineTwoBold: true
        });
      }
    };

    this.txService.transfer(environment.ethToken, this.toAddress, amount, environment.relayerFee, progressCallback).pipe(
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
