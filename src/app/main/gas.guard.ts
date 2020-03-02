import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { ZeroPoolService } from '../services/zero-pool.service';

@Injectable({
  providedIn: 'root'
})
export class GasGuard implements CanActivate {

  private gasBalance: number;
  private gasBalanceWasFetched = false;

  constructor(private router: Router, private zpService: ZeroPoolService) {
    // Watch for gas

    if (this.zpService.zpGasBalance) {
      this.gasBalance = this.zpService.zpGasBalance;
      this.gasBalanceWasFetched = true;
    }

    this.zpService.zpUpdates$.subscribe(
      () => {
        this.gasBalance = this.zpService.zpGasBalance;
        this.gasBalanceWasFetched = true;
      }
    );
  }

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {

    // return true;

    // TODO: uncomment when gas logic is implemented
    if (this.gasBalanceWasFetched && this.gasBalance > 0) {
      return true;
    }

    this.router.navigate(['/main/gas-is-needed']);
    return false;
  }
}
