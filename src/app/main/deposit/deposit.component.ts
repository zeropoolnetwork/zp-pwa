import { Component, Input, OnInit } from '@angular/core';
import { Location } from '@angular/common';

@Component({
  selector: 'app-deposit',
  templateUrl: './deposit.component.html',
  styleUrls: ['./deposit.component.scss']
})
export class DepositComponent implements OnInit {

  @Input()
  availableEthAmount: number;

  // TODO: from and validation
  depositAmount: number;
  transactionHash: string;

  isDone = false;
  depositInProgress = true;
  color = 'rgba(100, 100, 100, 0.5)';

  constructor(private location: Location) {
    this.availableEthAmount = 0.0000;
  }

  ngOnInit(): void {
  }

  onDepositClick(): void {
    //
  }

}
