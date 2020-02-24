import { Component, OnInit } from '@angular/core';
import { AccountService, IAccount } from '../account.service';
import { ZeroPoolService } from '../zero-pool.service';
import { Observable } from 'rxjs';
import { fw, HistoryItem } from 'zeropool-lib';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit {

  account$: Observable<IAccount>;
  balance = 1;
  history: HistoryItem[];

  constructor(private accountSvc: AccountService, private zeroPoolSvc: ZeroPoolService) {
    this.account$ = this.accountSvc.account$;

    this.zeroPoolSvc.activeZpNetwork$.subscribe();

    this.zeroPoolSvc.zpBalance$.subscribe(
      balances => {
        this.balance = fw(balances['0x0']) || 0;
      }
    );

    this.zeroPoolSvc.zpHistory$.subscribe(
      history => {
        this.history = history;
      }
    );

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
