import { Component, Input, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { LoadersCSS } from 'ngx-loaders-css';

@Component({
  selector: 'app-deposit',
  templateUrl: './deposit.component.html',
  styleUrls: ['./deposit.component.scss']
})
export class DepositComponent implements OnInit {

  @Input()
  availableEthAmount: number;

  depositAmount: number;
  transactionHash: string;

  isDone = false;
  depositInProgress = false;
  color = 'rgba(100, 100, 100, 0.5)';

  constructor(private location: Location) {
    this.availableEthAmount = 0.0000;
  }

  ngOnInit(): void {
  }

  navigateBack() {
    this.location.back();
  }

  onDepositClick(): void {
    //
  }

}
