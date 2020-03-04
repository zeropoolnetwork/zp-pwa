import { Injectable } from '@angular/core';
import { combineLatest, from, Observable, of } from 'rxjs';
import { TransactionService } from './transaction.service';
import { StateStorageService } from './state.storage.service';
import { catchError, concatMap, map, mergeMap, take, tap } from 'rxjs/operators';
import { MyUtxoState, Utxo } from 'zeropool-lib';
import { AccountService, IAccount } from './account.service';
import { environment } from '../../environments/environment';
import { ZeroPoolService } from './zero-pool.service';

export const defaultGasMaxFeeGwei = environment.relayerFee * 10;
export const defaultMinUtxoSizeGwei = environment.relayerFee;

export interface AutoJoinSettings {
  maxGasFee: number;
  minUtxoSize: number;
  isActivated: boolean;
  feeSpent: number;
}

@Injectable({
  providedIn: 'root'
})
export class AutoJoinUtxoService {

  constructor(
    private txService: TransactionService,
    private stateStorageService: StateStorageService,
    private accountService: AccountService,
    private zpService: ZeroPoolService
  ) {

    this.accountService.account$.subscribe(
      (account: IAccount) => {
        this.joinUtxo(account);
      }
    );
  }

  private joinUtxo(account: IAccount): void {
    const update$ = this.zpService.zpUpdates$.pipe(
      take(1),
      concatMap(() => {
          return this.processJoinUtxo(account);
        }
      ),
      tap((data: any) => {
        if (data !== '') {
          console.log('join-utxo: ', data);
        }
      }),
      take(1),
    );

    update$.subscribe();
  }

  private processJoinUtxo(account: IAccount): Observable<any> {
    return combineLatest([
      this.stateStorageService.getUtxoState(),
      this.stateStorageService.getGasUtxoState()
    ]).pipe(
      take(1),
      mergeMap(
        (x) => {

          const [state, gasState]: [MyUtxoState<string>, MyUtxoState<string>] = x;

          const { myAddress, amountToJoin } = this.calculateJoinAmount(state, gasState, account);

          if (amountToJoin === 0 && myAddress === '0') {
            return of('');
          }

          console.log('start join');
          return this.txService.transfer(environment.ethToken, myAddress, amountToJoin, environment.relayerFee).pipe(
            tap(() => {
              this.increaseFeeSpent();
            }),
            catchError((e) => {
              return of('tx failed');
            })
          );
        }
      ),
      take(1),
    );
  }

  private calculateJoinAmount(state, gasState, account: IAccount) {
    const settings = this.getSettings();
    if (!settings.isActivated) {
      console.log('auto join deactivated');
      return { myAddress: '0', amountToJoin: 0 };
    }

    if (settings.feeSpent + (environment.relayerFee) > settings.maxGasFee) {
      // todo: add notification when limit is over
      console.log('spent all allowed gas fee for auto-join');
      return { myAddress: '0', amountToJoin: 0 };
    }

    if (state.utxoList.length < 3) {
      console.log('nothing to join');
      return { myAddress: '0', amountToJoin: 0 };
    }

    // todo: add support of multi assets
    let amountToJoin = 0;
    let countOfUtxoToJoin = 0;

    state.utxoList = state.utxoList.sort(sortUtxo);

    for (const utxo of state.utxoList) {
      if (countOfUtxoToJoin === 2) {
        break;
      }

      if (Number(utxo.amount) < settings.minUtxoSize) {
        continue;
      }
      amountToJoin += Number(utxo.amount);
      countOfUtxoToJoin += 1;
    }

    if (countOfUtxoToJoin < 2) {
      console.log('nothing to join');
      return { myAddress: '0', amountToJoin: 0 };
    }

    if (
      gasState.utxoList
        .slice(0, 2)
        .reduce((acc, utxo) => {
          acc += Number(utxo.amount);
          return acc;
        }, 0) < environment.relayerFee
    ) {
      console.log('nothing enough fee');
      return { myAddress: '0', amountToJoin: 0 };
    }

    return {
      myAddress: account.zeropoolAddress,
      amountToJoin
    };
  }

  activateAutoJoin(maxGasFee: number, minUtxoSize: number): void {
    localStorage.setItem('auto-join', 'true');
    localStorage.setItem('max-gas-fee', String(maxGasFee));
    localStorage.setItem('min-utxo-size', String(minUtxoSize));
  }

  deactivateAutoJoin(): void {
    localStorage.setItem('auto-join', 'false');
    localStorage.removeItem('max-gas-fee');
    localStorage.removeItem('min-utxo-size');
  }

  getSettings(): AutoJoinSettings {
    return {
      maxGasFee: Number(localStorage.getItem('max-gas-fee')) || defaultGasMaxFeeGwei,
      minUtxoSize: Number(localStorage.getItem('min-utxo-size')) || defaultMinUtxoSizeGwei,
      isActivated: localStorage.getItem('auto-join') !== 'false', // activated by default
      feeSpent: Number(localStorage.getItem('fee-spent')) || 0
    };
  }

  increaseFeeSpent(): void {
    const oldFeeSpent = Number(localStorage.getItem('fee-spent')) || 0;
    localStorage.setItem('fee-spent', String(oldFeeSpent + environment.relayerFee));
  }

}

function sortUtxo(a: Utxo<string>, b: Utxo<string>): number {
  const diff = Number(b.amount) - Number(a.amount);
  if (diff < 0) {
    return -1;
  } else if (diff > 0) {
    return 1;
  } else {
    return 0;
  }
}
