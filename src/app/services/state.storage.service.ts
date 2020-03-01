import { Injectable } from '@angular/core';
import { HistoryState, MyUtxoState } from 'zeropool-lib';
import { StorageMap } from '@ngx-pwa/local-storage';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

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
    return this.storage.get<HistoryState>('history-state').pipe(
      // tap(() => {
      //   debugger
      // })
    ) as Observable<HistoryState>;
  }

  saveHistory(val: HistoryState): void {
    this.storage.set('history-state', val)
      .subscribe(() => {
      });
  }

  getUtxoState(): Observable<MyUtxoStateHex> {
    const result$ = this.storage.get<MyUtxoStateHex>('utxo-state').pipe(
      // tap(() => {
      //   debugger
      // })
    );
    return result$ as Observable<MyUtxoStateHex>;
  }

  saveUtxo(val: MyUtxoStateHex): void {
    this.storage.set('utxo-state', val)
      .subscribe(() => {
      });
  }


  // private setItem(filed: string, item: any): void {
  //   localStorage.setItem(filed, JSON.stringify(item));
  // }
  //
  // private getItem<T>(field: string): T {
  //   const data = localStorage.getItem(field);
  //
  //   try {
  //     return JSON.parse(data);
  //   } catch (e) {
  //     localStorage.removeItem(field);
  //     return undefined;
  //   }
  // }
}
