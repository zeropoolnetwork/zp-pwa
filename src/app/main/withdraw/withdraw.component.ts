import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ZeroPoolService } from '../../services/zero-pool.service';
import { RelayerApiService } from '../../services/relayer.api.service';
import { bigintifyUtxoState, BlockItem, MyUtxoState, tw, Utxo } from 'zeropool-lib';
import { fromPromise } from 'rxjs/internal-compatibility';
import { mergeMap } from 'rxjs/operators';
import { StateStorageService } from '../../services/state.storage.service';

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
    // toAddress: ['']
  });

  get toAmount(): number {
    return this.transferForm.get('toAmount').value;
  }

  // get toAddress(): string {
  //   return this.transferForm.get('toAddress').value;
  // }

  constructor(
    private fb: FormBuilder,
    private zpService: ZeroPoolService,
    private relayerApi: RelayerApiService,
    private stateStorageService: StateStorageService
  ) {
  }

  ngOnInit(): void {
    //
  }

  onSendClick(): void {
    this.withdrawIsInProgress = true;

    const amount = tw(this.toAmount).toNumber();


    fromPromise(
      this.zpService.zp.myUtxoState(
        bigintifyUtxoState(this.stateStorageService.utxoState)
      )
    ).pipe(
      mergeMap(
        (state: MyUtxoState<bigint>) => {

          let tmp = 0;
          const utxoIn: Utxo<bigint>[] = [];
          for (const [i, utxo] of state.utxoList.entries()) {
            if (i === 2) {
              throw new Error('max 2 utxo per withdraw');
            }
            if (tmp >= amount) {
              break;
            }

            tmp += Number(utxo.amount);
            utxoIn.push(utxo);
          }

          return fromPromise(this.zpService.zp.prepareWithdraw(utxoIn));
        }
      ),
      mergeMap((blockItem: BlockItem<string>) => {
          return this.relayerApi.sendTx$(blockItem);
        }
      )
    ).subscribe(
      (tx: any) => {
        // (tx: Transaction) => {
        this.isDone = true;
        this.transactionHash = tx.transactionHash;
      }
    );

  }

}
