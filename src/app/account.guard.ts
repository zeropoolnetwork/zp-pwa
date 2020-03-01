import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { getEthAddressSafe, Web3ProviderService } from './services/web3.provider.service';

@Injectable({
  providedIn: 'root'
})
export class AccountGuard implements CanActivate {

  constructor(private router: Router, web3: Web3ProviderService) {
    //
  }

  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot) {

    if (!localStorage.getItem('mnemonic')) {
      this.router.navigate(['welcome']);
    }

    if (!getEthAddressSafe()) {
      this.router.navigate(['connect-wallet']);
    }

    return true;

    // if (localStorage.getItem('mnemonic') && getEthAddressSafe() /* && ethAddress*/) {
    //   // logged in so return true
    //   console.log('b');
    //   return true;
    // }
    //
    // // not logged in so redirect to login page with the return url and return false
    // // this.router.navigate(['welcome'], { queryParams: { returnUrl: state.url }});
    // // this.router.navigate(['welcome']);
    // return false;
  }
}
