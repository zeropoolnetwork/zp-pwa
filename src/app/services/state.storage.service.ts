import { Injectable } from '@angular/core';
import { HistoryState, MyUtxoState } from 'zeropool-lib';
import { StorageMap } from '@ngx-pwa/local-storage';
import { Observable } from 'rxjs';

export type MyUtxoStateHex = MyUtxoState<string>;
export type MyUtxoStateInt = MyUtxoState<bigint>;

@Injectable()
export class YourService {
  constructor(private storage: StorageMap) {
  }
}

@Injectable({
  providedIn: 'root'
})
export class StateStorageService {

  constructor(private storage: StorageMap) {
  }

  getHistoryState(): Observable<HistoryState> {
    return this.storage.get<HistoryState>('history-state') as Observable<HistoryState>;
  }

  saveHistory(val: HistoryState): void {
    this.storage.set('history-state', val).subscribe(() => {});
  }

  getUtxoState(): Observable<MyUtxoStateHex> {
    const result$ = this.storage.get<MyUtxoStateHex>('utxo-state');
    return result$ as Observable<MyUtxoStateHex>;
  }

  saveUtxo(val: MyUtxoStateHex): void {
    this.storage.set('utxo-state', val).subscribe(() => {});
  }

  resetStorage(): Observable<undefined>{
    // this.storage.delete('utxo-state').subscribe(() => {});
    // this.storage.delete('history-state').subscribe(() => {});
    return this.storage.clear();
  }
}
