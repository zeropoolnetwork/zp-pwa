import { Injectable } from '@angular/core';
import { HttpProvider } from 'web3-providers-http';
import { interval, merge, Observable, of, Subject } from 'rxjs';
import { catchError, distinctUntilChanged, filter, map, shareReplay, switchMap, take, takeUntil, tap } from 'rxjs/operators';
import { fromPromise } from 'rxjs/internal-compatibility';
import { environment } from '../../environments/environment';
import Web3 from 'web3';
import { Router } from '@angular/router';

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

  constructor(router: Router) {

    this.address$ = merge(this.alreadyConnected$, this.manuallyConnected$).pipe(
      filter((provider: HttpProvider) => {
        this.web3Provider = provider;
        const isOk = this.checkNetwork(provider);
        if (!isOk) {
          router.navigate(['select-network']);
        }
        return isOk;
      }),
      map(() => getEthAddressSafe()),
      distinctUntilChanged(),
      shareReplay()
    );

    this.isReady$ = this.address$.pipe(
      map(address => !!address),
    );

    interval(500).pipe(
      tap(
        () => {
          this.refreshWeb3ConnectionState();
        }
      ),
      takeUntil(this.isReady$)
    ).subscribe();

  }

  refreshWeb3ConnectionState(): void {
    if (getEthAddressSafe()) {
      this.alreadyConnected$.next(window.ethereum);
    }
  }

  getWeb3GasProvider(): HttpProvider {
    const w3 = new Web3(environment.sideChainRpc);
    return w3.currentProvider as HttpProvider;
  }

  connectWeb3(): boolean {
    if (typeof ethereum !== 'undefined') {
      this.enableWeb3(ethereum);
      ethereum.on('networkChanged', () => {
        window.location.reload();
      });
      ethereum.on('accountsChanged', () => {
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
      tap(() => {
        this.manuallyConnected$.next(eth);
      })
    ).subscribe();
  }

  public isCorrectNetworkSelected(): boolean {
    return this.web3Provider && (this.web3Provider as any).chainId === environment.chainId;
  }

  public checkNetwork(provider: any): boolean {
    console.log({chain: provider.chainId});
    return provider.chainId === environment.chainId;
  }

}
