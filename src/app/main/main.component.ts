import { Component, OnInit } from '@angular/core';
import { AccountService, IAccount } from '../account.service';
import { ZeroPoolService } from '../zero-pool.service';
import { combineLatest, Observable } from 'rxjs';
import { map, mergeMap, tap } from 'rxjs/operators';
import { fw, HistoryItem, HistoryState } from 'zeropool-lib';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit {

  account$: Observable<IAccount>;
  balance = 1;
  history: HistoryItem[];

  constructor(private accountSvc: AccountService, private zeropoolSvc: ZeroPoolService) {
    this.account$ = this.accountSvc.account$;
    zeropoolSvc.activeZpNetwork$.pipe(
      mergeMap(
        zp => {
          return combineLatest([zp.getBalance(), zp.utxoHistory()]);
        }
      ),
      tap(
        ([balances, history]) => {
          this.balance = fw(balances['0x0']) || 0;
          this.history = history.items;
        }
      )
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
