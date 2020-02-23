import { Component, OnInit } from '@angular/core';
import { AccountService, IAccount } from '../account.service';
import { ZeropoolService } from '../zeropool.service';
import { Observable } from 'rxjs';
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
  history = [
    {type: 'transfer', amount: 10},
    {type: 'deposit', amount: 10},
    {type: 'withdraw', amount: 10},
  ];

  constructor(private accountSvc: AccountService, private zeropoolSvc: ZeropoolService) {
    this.account$ = this.accountSvc.account$;
  }

  ngOnInit(): void {

  }

  deposit() {
    this.zeropoolSvc.activeZpNetwork$.pipe(
      switchMap((zpn) => {
        return fromPromise(zpn.deposit('0x0000000000000000000000000000000000000000', 100000));
      })
    ).subscribe((result) => {
      debugger
    });
  }

  transfer() {

  }

  withdraw() {

  }
}
