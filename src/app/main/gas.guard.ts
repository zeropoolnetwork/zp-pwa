import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { ZeroPoolService } from '../services/zero-pool.service';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class GasGuard implements CanActivate {

  constructor(private router: Router, private zpService: ZeroPoolService) {
    //
  }

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {

    return this.zpService.isReady$.pipe(
      map((isReady) => {

        let url = '';
        if (!isReady) {
          url = '/main';
        } else if (!this.zpService.zpGasBalance) {
          url = '/main/gas-is-needed';
        }

        return url ? this.router.parseUrl(url) : true;
      }),
    );
  }
}

