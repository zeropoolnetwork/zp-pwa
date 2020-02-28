import { Component, Input, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { ZeroPoolService } from '../../services/zero-pool.service';
import { BlockItem, DepositProgressNotification, tw } from 'zeropool-lib';
import { Transaction } from 'web3-core';
import { mergeMap } from 'rxjs/operators';
import { fromPromise } from 'rxjs/internal-compatibility';
import { RelayerApiService } from '../../services/relayer.api.service';
import { FormBuilder, FormGroup } from '@angular/forms';
import { environment } from '../../../environments/environment';
import { Observable, Subject } from 'rxjs';


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

    // generate tx and send eth to contract
    fromPromise(this.zpService.zp.deposit(environment.ethToken, amount, (update) => {
      this.depositProgressNotificator.next(update);
    })).pipe(
      mergeMap((blockItem: BlockItem<string>) => {
          return this.relayerApi.sendTx$(blockItem);
        }
      )
    ).subscribe(
      (tx: Transaction) => {
        this.isDone = true;
        this.transactionHash = tx.transactionHash;
      }
    );
  }

}
