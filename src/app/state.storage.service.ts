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

  get utxoState(): MyUtxoState<string> | undefined {
    return this.getItem<MyUtxoState<string>>('utxo-state');
  }

  set utxoState(val: MyUtxoState<string>) {
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
