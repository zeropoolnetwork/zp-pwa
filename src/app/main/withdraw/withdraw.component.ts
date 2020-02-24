import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';

@Component({
  selector: 'app-withdraw',
  templateUrl: './withdraw.component.html',
  styleUrls: ['./withdraw.component.scss']
})
export class WithdrawComponent implements OnInit {

  //
  myZpBalance: number;

  //
  toAmount: number;
  toAddress: string;

  isDone = false;
  withdrawIsInProgress = false;


  constructor() {
    //
  }

  ngOnInit(): void {
  }

  onSendClick() {
    //
  }

}
