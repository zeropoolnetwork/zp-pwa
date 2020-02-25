import { Injectable } from '@angular/core';
import { HttpProvider } from 'web3-providers-http';
import { BehaviorSubject, Observable, of, interval, Subject } from 'rxjs';
import { catchError, filter, map, switchMap, take, tap } from 'rxjs/operators';
import { fromPromise } from 'rxjs/internal-compatibility';


// TODO: move declarations into polyfills
declare let ethereum: any;
declare let window: any;
declare let web3: any;

function getEthAddressSafe() {
  return window.ethereum && window.ethereum.selectedAddress;
}

@Injectable({
  providedIn: 'root'
})
export class Web3ProviderService {

  public web3Provider: HttpProvider;

  private addressSubject$ = new Subject<string>();
  public address$ = this.addressSubject$.asObservable();
  public isReady$: Observable<boolean>;


  // TODO: redesign to eth address

  constructor() {

    this.isReady$ = this.addressSubject$.asObservable().pipe(
      map(address => !!address),
    );

    if (getEthAddressSafe()) {
      this.addressSubject$.next(getEthAddressSafe());
    }
  }

  /**
   * Checks fo different version of injected web3 and activate it if needed
   * note: the fact that provider is found doesn't mean it's ready
   * @returns true if any provider was found
   */
  connectWeb3(): boolean {

    if (typeof ethereum !== 'undefined') {
      this.enableWeb3(ethereum);
      this.web3Provider = ethereum;
      ethereum.on('accountsChanged', () => {
        window.location.reload();
      });

      ethereum.on('networkChanged', () => {
        window.location.reload();
      });
      return true;
    }

    if (typeof window.web3 !== 'undefined') {
      this.web3Provider = window.web3.currentProvider;
      return true;
    }

    if (typeof web3 !== 'undefined') {
      this.web3Provider = web3.currentProvider;
      return true;
    }

    return false;
  }

  private enableWeb3(eth: any): void {
    fromPromise(eth.enable()).pipe(
      catchError((e) => {
        console.log(e);
        return of('');
      }),
      // switchMap(() => {
      //   return interval(100);
      // }),
      map(() => {
        return getEthAddressSafe();
      }),
      filter(address => !!address),
      take(1),
      tap(() => {
        this.addressSubject$.next(getEthAddressSafe());
      })
    ).subscribe();
  }

}
