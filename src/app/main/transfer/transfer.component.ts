import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { tw } from 'zeropool-lib';
import { environment } from '../../../environments/environment';
import { TransactionService } from '../../services/transaction.service';

@Component({
  selector: 'app-transfer',
  templateUrl: './transfer.component.html',
  styleUrls: ['./transfer.component.scss']
})
export class TransferComponent implements OnInit {

  transactionHash: string;

  myZpBalance: number;

  isDone = false;
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

    this.txService.transfer(environment.ethToken, this.toAddress, amount, environment.relayerFee).subscribe(
      (txHash: string) => {
        this.isDone = true;
        console.log({ transfer: txHash });
      }
    );

  }

}
