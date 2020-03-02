import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ZeroPoolService } from '../../services/zero-pool.service';
import { RelayerApiService } from '../../services/relayer.api.service';
import { bigintifyUtxoState, BlockItem, MyUtxoState, tw, Tx, Utxo } from 'zeropool-lib';
import { fromPromise } from 'rxjs/internal-compatibility';
import { mergeMap, switchMap, tap } from 'rxjs/operators';
import { MyUtxoStateHex, StateStorageService } from '../../services/state.storage.service';
import { getEthAddressSafe, Web3ProviderService } from '../../services/web3.provider.service';
import { ValidateMnemonic } from '../../account-setup/mnemonic.validator';
import { environment } from '../../../environments/environment';
import { combineLatest, of } from 'rxjs';
import { Transaction } from 'web3-core';

@Component({
  selector: 'app-withdraw',
  templateUrl: './withdraw.component.html',
  styleUrls: ['./withdraw.component.scss']
})
export class WithdrawComponent implements OnInit {

  transactionHash: string;

  myZpBalance: number;

  isDone = false;
  withdrawIsInProgress = false;

  public transferForm: FormGroup = this.fb.group({
    toAmount: [''],
    toAddress: new FormControl('', [
      // Validators.required,
      // ValidateMnemonic
    ])
  });

  get toAmount(): number {
    return this.transferForm.get('toAmount').value;
  }

  get toAddress(): string {
    return this.transferForm.get('toAddress').value;
  }

  constructor(
    private fb: FormBuilder,
    private zpService: ZeroPoolService,
    private relayerApi: RelayerApiService,
    private stateStorageService: StateStorageService
  ) {
  }

  ngOnInit(): void {
    const a = getEthAddressSafe();
    this.transferForm.get('toAddress').setValue(a.replace('0x', ''));
  }

  onSendClick(): void {
    this.withdrawIsInProgress = true;

    const amount = tw(this.toAmount).toNumber();

    fromPromise(this.zpService.zp.prepareWithdraw(environment.ethToken, amount))
      .pipe(
        mergeMap(
          ([tx, txHash]: [Tx<string>, string]) => {
            const gasTx$ = fromPromise(this.zpService.zpGas.prepareWithdraw(environment.ethToken, environment.relayerFee));
            const tx$ = of(tx);
            return combineLatest([tx$, gasTx$]);
          }
        ),
        mergeMap(
          ([tx, gasTx]: [Tx<string>, [Tx<string>, string]]) => {
            return this.relayerApi.sendTx$(tx, '0x0', gasTx[0]);
          }
        )
      ).subscribe(
      (tx: any) => {
        this.isDone = true;
        this.transactionHash = tx.transactionHash;
      }
    );

  }

}
