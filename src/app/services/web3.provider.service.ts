import { Injectable } from '@angular/core';
import { HttpProvider } from 'web3-providers-http';
import { Observable, of, interval, Subject, merge } from 'rxjs';
import { catchError, distinctUntilChanged, filter, map, switchMap, take, tap } from 'rxjs/operators';
import { fromPromise } from 'rxjs/internal-compatibility';

// TODO: move declarations into polyfills
declare let ethereum: any;
declare let window: any;
declare let web3: any;

export function getEthAddressSafe() {
  return window.ethereum && window.ethereum.selectedAddress;
  // return window.ethereum && ethereum.isMetaMask && window.ethereum.selectedAddress;
}

@Injectable({
  providedIn: 'root'
})
export class Web3ProviderService {

  public web3Provider: HttpProvider;

  public address$: Observable<string>;
  public isReady$: Observable<boolean>;

  private alreadyConnected$ = new Subject<HttpProvider>();
  private manuallyConnected$ = new Subject<HttpProvider>();

  constructor() {

    this.address$ = merge(this.alreadyConnected$, this.manuallyConnected$).pipe(
      tap((eth: HttpProvider) => {
        this.web3Provider = eth;

        // TODO: Double check that
        (eth as any).on('accountsChanged', () => {
          window.location.reload();
        });
      }),
      map(() => getEthAddressSafe()),
      distinctUntilChanged()
    );

    this.isReady$ = this.address$.pipe(
      map(address => !!address),
    );

  }

  refreshWeb3ConnectionState(): void {
    if (getEthAddressSafe()) {
      this.alreadyConnected$.next(window.ethereum);
    }
  }

  connectWeb3(): boolean {
    if (typeof ethereum !== 'undefined') {
      this.enableWeb3(ethereum);

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

  // TODO: move to static utils
  private enableWeb3(eth: any): void {
    fromPromise(eth.enable()).pipe(
      catchError((e) => {
        console.log(e);
        return of('');
      }),
      switchMap(() => {
        return interval(100);
      }),
      map(() => getEthAddressSafe()),
      filter(address => !!address),
      take(1),
    ).subscribe();
  }

}
