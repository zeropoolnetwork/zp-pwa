import { Component, Input, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { ZeroPoolService } from '../../services/zero-pool.service';
import { DepositProgressNotification, tw, Tx } from 'zeropool-lib';
import { mergeMap } from 'rxjs/operators';
import { fromPromise } from 'rxjs/internal-compatibility';
import { RelayerApiService } from '../../services/relayer.api.service';
import { FormBuilder, FormGroup } from '@angular/forms';
import { environment } from '../../../environments/environment';
import { combineLatest, Observable, of, Subject } from 'rxjs';


@Component({
  selector: 'app-deposit',
  templateUrl: './deposit.component.html',
  styleUrls: ['./deposit.component.scss']
})
export class DepositComponent implements OnInit {

  private depositProgressNotificator: Subject<DepositProgressNotification> = new Subject();
  private depositProgressNotificator$: Observable<DepositProgressNotification> =
    this.depositProgressNotificator.asObservable();

  @Input()
  availableEthAmount: number;

  transactionHash: string;

  isDone = false;
  depositInProgress = false;
  color = 'rgba(100, 100, 100, 0.5)';


  public depositForm: FormGroup = this.fb.group({
    amount: [''],
  });

  get depositAmount(): number {
    return this.depositForm.get('amount').value;
  }

  constructor(
    private location: Location,
    private zpService: ZeroPoolService,
    private relayerApi: RelayerApiService,
    private fb: FormBuilder
  ) {

    this.depositProgressNotificator$.subscribe(
      (update) => {
        console.log(update);
      }
    );

    this.availableEthAmount = 0.0000;
  }

  ngOnInit(): void {
  }

  onDepositClick(): void {
    this.depositInProgress = true;

    const amount = tw(this.depositAmount).toNumber();

    fromPromise(this.zpService.zp.prepareDeposit(environment.ethToken, amount))
      .pipe(
        mergeMap(
          ([tx, txHash]: [Tx<string>, string]) => {
            const depositBlockNumber$ = fromPromise(this.zpService.zp.deposit(environment.ethToken, amount, txHash));
            const gasTx$ = fromPromise(this.zpService.zpGas.prepareWithdraw(environment.ethToken, environment.relayerFee));
            const tx$ = of(tx);
            return combineLatest([tx$, depositBlockNumber$, gasTx$]);
          }
        ),
        mergeMap(
          ([tx, depositBlockNumber, gasTx]: [Tx<string>, number, [Tx<string>, string]]) => {
            return this.relayerApi.sendTx$(tx, depositBlockNumber, gasTx[0]);
          }
        ),
      ).subscribe(
      (transaction: any) => {
        this.isDone = true;
        console.log(transaction.transactionHash);
      }
    );

    // generate tx and send eth to contract
  }

}
