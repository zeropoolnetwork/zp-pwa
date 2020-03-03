import { Injectable } from '@angular/core';
import { combineLatest, interval, of } from 'rxjs';
import { TransactionService } from './transaction.service';
import { StateStorageService } from './state.storage.service';
import { catchError, map, mergeMap, tap } from 'rxjs/operators';
import { MyUtxoState } from 'zeropool-lib';
import { AccountService, IAccount } from './account.service';
import { environment } from '../../environments/environment';

export const defaultGasMaxFeeGwei = 32000;
export const defaultMinUtxoSizeGwei = 320;

export interface AutoJoinSettings {
  maxGasFee: number;
  minUtxoSize: number;
  isActivated: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AutoJoinUtxoService {

  constructor(
    private txService: TransactionService,
    private stateStorageService: StateStorageService,
    private accountService: AccountService
  ) {

    interval(10000).pipe(
      mergeMap(
        () => {
          return combineLatest([
            this.accountService.account$,
            this.stateStorageService.getGasUtxoState()
          ]);
        }
      ),
      map(
        (x: any) => {
          const [account, state]: [IAccount, MyUtxoState<string>] = x;

          const settings = this.getSettings();
          if (!settings.isActivated) {
            throw new Error('auto join deactivated');
          }

          if (state.utxoList.length < 3) {
            throw new Error('nothing to join');
          }

          // todo: add support of multi assets
          let amountToJoin = 0;
          let countOfUtxoToJoin = 0;
          for (const utxo of state.utxoList) {
            if (countOfUtxoToJoin === 2) {
              break;
            }

            if (utxo.amount < settings.minUtxoSize) {
              continue;
            }
            amountToJoin += Number(utxo.amount);
            countOfUtxoToJoin += 1;
          }

          if (countOfUtxoToJoin < 2) {
            throw new Error('nothing to join');
          }

          return {
            myAddress: account.zeropoolAddress,
            amountToJoin
          };

        }
      ),
      mergeMap(
        ({ myAddress, amountToJoin }) => {
          return this.txService.transfer(environment.ethToken, myAddress, amountToJoin, environment.relayerFee);
        }
      ),
      catchError((e) => {
        return of(e);
      }),
      tap((data: any) => {
        console.log('done: ', data);
      })
    );
  }

  activateAutoJoin(maxGasFee: string, minUtxoSize: string): void {
    localStorage.setItem('auto-join', 'true');
    localStorage.setItem('max-gas-fee', maxGasFee);
    localStorage.setItem('min-utxo-size', minUtxoSize);
  }

  deactivateAutoJoin(): void {
    localStorage.setItem('auto-join', 'false');
    localStorage.removeItem('max-gas-fee');
    localStorage.removeItem('min-utxo-size');
  }

  getSettings(): AutoJoinSettings {
    return {
      maxGasFee: localStorage.getItem('max-gas-fee') || defaultGasMaxFeeGwei,
      minUtxoSize: localStorage.getItem('min-utxo-size') || defaultMinUtxoSizeGwei,
      isActivated: localStorage.getItem('auto-join') !== 'false'
    };
  }

}
