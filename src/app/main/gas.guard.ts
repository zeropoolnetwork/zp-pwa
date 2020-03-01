import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
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
    this.zpService.zpGasBalance$.subscribe(
      (gasBalance: number) => {
        this.gasBalance = gasBalance;
        this.gasBalanceWasFetched = true;
      }
    );
  }

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {

    if (this.gasBalanceWasFetched && this.gasBalance > 0) {
      return true;
    }

    this.router.navigate(['/main/gas-is-needed']);
    return false;
  }
}
