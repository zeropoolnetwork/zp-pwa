import { HttpClient } from '@angular/common/http';
import { catchError, delay, map, mergeMap, retryWhen } from 'rxjs/operators';
import { Observable, of, throwError } from 'rxjs';
import { Injectable } from '@angular/core';
import { Tx } from 'zeropool-lib';
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

  getRelayerAddress$(): Observable<string> {
    const url = environment.relayerUrl + '/relayer';
    return this.http.get(url).pipe(
      delayedRetry(1000),
      map(
        (x: any) => {
          return x.address;
        }
      )
    );
  }

  sendTx$(tx: Tx<string>, depositBlockNumber: string, gasTx: Tx<string>): Observable<Transaction> {
    const body = {
      tx,
      depositBlockNumber,
      gasTx
    };

    const url = environment.relayerUrl + '/tx';
    return this.http.post<Transaction>(url, body).pipe(
      // delayedRetry(1000),
      map(response => {
        return response;
      }),
    );
  }

  gasDonation$(tx: Tx<string>, ethTxHash: string): Observable<Transaction> {
    const body = {
      gasTx: tx,
      donationHash: ethTxHash
    };

    const url = environment.relayerUrl + '/tx/donation';
    return this.http.post<Transaction>(url, body).pipe(
      // delayedRetry(1000),
      map(response => {
        return response;
      }),
    );
  }


}
