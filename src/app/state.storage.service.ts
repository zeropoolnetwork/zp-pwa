import { Injectable } from '@angular/core';
import { HistoryState, MyUtxoState } from 'zeropool-lib';

@Injectable({
  providedIn: 'root'
})
export class StateStorageService {

  constructor() {
  }

  get historyState(): HistoryState | undefined {
    return this.getItem<HistoryState>('history-state');
  }

  set historyState(val: HistoryState) {
    this.setItem('history-state', val);
  }

  get utxoState(): MyUtxoState | undefined {
    return this.getItem<MyUtxoState>('utxo-state');
  }

  set utxoState(val: MyUtxoState) {
    const stringUtxoState = {
      nullifiers: undefined,
      lastBlockNumber: undefined
    };
    stringUtxoState.nullifiers = val.nullifiers.map(String);
    stringUtxoState.lastBlockNumber = val.lastBlockNumber;
    // val.utxoList.map(x => x.)
    this.setItem('utxo-state', val);
  }


  private setItem(filed: string, item: any): void {
    localStorage.setItem(filed, JSON.stringify(item));
  }

  private getItem<T>(field: string): T {
    const data = localStorage.getItem(field);

    try {
      return JSON.parse(data);
    } catch (e) {
      localStorage.removeItem(field);
      return undefined;
    }
  }
}
