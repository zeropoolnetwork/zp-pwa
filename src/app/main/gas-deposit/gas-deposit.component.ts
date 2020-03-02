import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { tw } from 'zeropool-lib';
import { fromPromise } from 'rxjs/internal-compatibility';
import { environment } from '../../../environments/environment';
import { mergeMap } from 'rxjs/operators';
import { ZeroPoolService } from '../../services/zero-pool.service';
import { RelayerApiService } from '../../services/relayer.api.service';
import { Transaction } from 'web3-core';
import { combineLatest, of } from 'rxjs';

@Component({
  selector: 'app-gas-deposit',
  templateUrl: './gas-deposit.component.html',
  styleUrls: ['./gas-deposit.component.scss']
})
export class GasDepositComponent implements OnInit {

  isDone = false;
  inProgress = false;

  form: FormGroup = this.fb.group({
    toAmount: [''],
    // toAddress: ['']
  });

  get depositAmount(): number {
    return this.form.get('toAmount').value;
  }

  constructor(
    private fb: FormBuilder,
    private zpService: ZeroPoolService,
    private relayerApi: RelayerApiService
  ) {
  }

  ngOnInit(): void {
  }

  depositGas() {
    this.inProgress = true;

    const amount = tw(this.depositAmount).toNumber();

    const relayerAddress$ = this.relayerApi.getRelayerAddress$();

    relayerAddress$.pipe(
      mergeMap(
        (address: string) => {
          return fromPromise(
            this.zpService.zp.ZeroPool.web3Ethereum.sendTransaction(
              address,
              amount
            )
          );
        }
      ),
      mergeMap(
        (txData: Transaction) => {
          const zpTxData$ = fromPromise(this.zpService.zpGas.prepareDeposit(environment.ethToken, amount));
          // @ts-ignore
          const txHash$ = of(txData.transactionHash);
          return combineLatest([zpTxData$, txHash$]);
        }
      ),
      mergeMap(
        (x: any[]) => {
          const [zpTxData, txHash] = x;
          return this.relayerApi.gasDonation$(zpTxData[0], txHash);
        }
      ),
    ).subscribe(
      (x: any) => {
        this.inProgress = false;
        this.isDone = true;

        console.log(x.transactionHash);
      }
    );

  }
}
