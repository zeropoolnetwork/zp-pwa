import { Component, OnInit } from '@angular/core';
import { AccountService, IAccount } from '../account.service';
import { ZeroPoolService } from '../zero-pool.service';
import { combineLatest, Observable } from 'rxjs';
import { fw, HistoryItem, HistoryState } from 'zeropool-lib';
import { switchMap, tap } from 'rxjs/operators';
import { fromPromise } from 'rxjs/internal-compatibility';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit {

  account$: Observable<IAccount>;
  balance = 1;
  history: HistoryItem[];

  constructor(private accountSvc: AccountService, private zpService: ZeroPoolService) {
    this.account$ = this.accountSvc.account$;

    fromPromise(this.zpService.zp$).pipe(
      switchMap((zp) => {
        return combineLatest([
          fromPromise(zp.getBalance()),
          fromPromise(zp.utxoHistory())
        ]);
      }),
      tap((x) => {
        const [balances, history]: [{ [key: string]: number }, HistoryState] = x;
        this.history = history.items;
        this.balance = fw(balances['0x0']) || 0;
      })
    ).subscribe();

  }

  ngOnInit(): void {

  }

  deposit() {

  }

  transfer() {

  }

  withdraw() {

  }
}
