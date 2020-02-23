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

  // @Output()
  // backClick = new EventEmitter<boolean>();

  isDone = false;
  showSpinner = false;
  bgColor = 'black';
  color = 'rgba(100, 100, 100, 0.5)';
  loader: LoadersCSS = 'pacman';

  constructor(private location: Location) {
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
