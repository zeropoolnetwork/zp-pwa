import { HttpClient } from '@angular/common/http';
import { delay, map, mergeMap, retryWhen, switchMap } from 'rxjs/operators';
import { interval, Observable, of, throwError } from 'rxjs';
import { Injectable } from '@angular/core';
import { BlockItem } from 'zeropool-lib';
import { Transaction } from 'web3-core';
import { environment } from '../../environments/environment';

const DEFAULT_MAX_RETRIES = 1;

export function delayedRetry(delayMs: number, maxRetry = DEFAULT_MAX_RETRIES) {
  let retries = maxRetry;

  return (src: Observable<any>) =>
    src.pipe(
      retryWhen((errors: Observable<any>) => errors.pipe(
        delay(delayMs),
        mergeMap(error => (retries--) > 0 ? of(error) : throwError(error))
      ))
    );
}

@Injectable({
  providedIn: 'root'
})
export class RelayerApiService {

  constructor(private http: HttpClient) {
    //
  }

  getGasBalance(): Observable<number> {
    return of(0.25);
  }

  sendTx$(blockItem: BlockItem<string>): Observable<string> {
    const url = environment.relayerUrl + '/tx';
    return this.http.post<Transaction>(url, blockItem).pipe(
      delayedRetry(1000),
      map(response => {
        return response;
      }),
    );
  }


}
