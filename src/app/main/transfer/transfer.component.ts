import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-transfer',
  templateUrl: './transfer.component.html',
  styleUrls: ['./transfer.component.scss']
})
export class TransferComponent implements OnInit {

  //
  myZpBalance: number;

  //
  toAmount: number;
  toAddress: string;

  isDone = false;
  transferIsInProgress = false;


  constructor() {
    //
  }

  ngOnInit(): void {
  }

  onSendClick() {
    //
  }
}
