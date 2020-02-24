import { Injectable } from '@angular/core';
import { HttpProvider } from 'web3-providers-http';
import { Observable, of } from 'rxjs';
import { fromPromise } from 'rxjs/internal-compatibility';
import { catchError, map } from 'rxjs/operators';

declare let ethereum: any;
declare let window: any;
declare let web3: any;


@Injectable({
  providedIn: 'root'
})
export class Web3ProviderService {

  public web3Provider: HttpProvider;
  public isReady$: Observable<boolean>;

  constructor() {
    this.isReady$ = fromPromise(this.connect())
      .pipe(
        catchError(e => {
          console.log(e);
          // todo: alert + retry
          return of(false);
        }),
        map(() => true)
      )
    ;
  }

  async connect(): Promise<void> {
    if (typeof ethereum !== 'undefined') {

      this.web3Provider = ethereum;

      try {

        await ethereum.enable();

      } catch (error) {

        // User denied account access
        throw new Error('No web3 provider!');
      }

      if (typeof ethereum.on !== 'undefined') {

        ethereum.on('accountsChanged', () => {
          window.location.reload();
        });

        ethereum.on('networkChanged', () => {
          window.location.reload();
        });
      }

    } else if (typeof window.web3 !== 'undefined') {

      this.web3Provider = window.web3.currentProvider;

    } else if (typeof web3 !== 'undefined') {

      this.web3Provider = web3.currentProvider;

    } else {

      throw new Error('No web3 provider!');
    }

  }

}
