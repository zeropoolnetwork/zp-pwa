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

  // onStorageReset$ = new Subject<boolean>();
  storageResetWasCalled = false;

  constructor(private storage: StorageMap) {
    this.getHistoryState = this.getHistoryState.bind(this);
    this.saveHistory = this.saveHistory.bind(this);
    this.getGasHistoryState = this.getGasHistoryState.bind(this);
    this.saveGasHistory = this.saveGasHistory.bind(this);
    this.getUtxoState = this.getUtxoState.bind(this);
    this.saveUtxo = this.saveUtxo.bind(this);
    this.getGasUtxoState = this.getGasUtxoState.bind(this);
    this.saveGasUtxo = this.saveGasUtxo.bind(this);
    this.resetStorage = this.resetStorage.bind(this);
  }

  getHistoryState(): Observable<HistoryState<string>> {
    return this.storage.get<HistoryState<string>>('history-state') as Observable<HistoryState<string>>;
  }

  saveHistory(val: HistoryState<string>): void {
    if (this.storageResetWasCalled) {
      return;
    }

    this.storage.set('history-state', val).subscribe(() => {
    });
  }

  getGasHistoryState(): Observable<HistoryState<string>> {
    return this.storage.get<HistoryState<string>>('gas-history-state') as Observable<HistoryState<string>>;
  }

  saveGasHistory(val: HistoryState<string>): void {
    if (this.storageResetWasCalled) {
      return;
    }

    this.storage.set('gas-history-state', val).subscribe(() => {
    });
  }

  getUtxoState(): Observable<MyUtxoStateHex> {
    const result$ = this.storage.get<MyUtxoStateHex>('utxo-state');
    return result$ as Observable<MyUtxoStateHex>;
  }

  saveUtxo(val: MyUtxoStateHex): void {
    if (this.storageResetWasCalled) {
      return;
    }

    this.storage.set('utxo-state', val).subscribe(() => {
    });
  }

  getGasUtxoState(): Observable<MyUtxoStateHex> {
    const result$ = this.storage.get<MyUtxoStateHex>('gas-utxo-state');
    return result$ as Observable<MyUtxoStateHex>;
  }

  saveGasUtxo(val: MyUtxoStateHex): void {
    if (this.storageResetWasCalled) {
      return;
    }

    this.storage.set('gas-utxo-state', val).subscribe(() => {
    });
  }

  resetStorage(): Observable<undefined> {
    this.storageResetWasCalled = true;
    // this.onStorageReset$.next(true);
    // this.storage.delete('utxo-state').subscribe(() => {});
    // this.storage.delete('history-state').subscribe(() => {});
    return this.storage.clear();
  }
}
