import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';

@Component({
  selector: 'app-deposit',
  templateUrl: './deposit.component.html',
  styleUrls: ['./deposit.component.scss']
})
export class DepositComponent implements OnInit {

  constructor(private location: Location) {
  }

  ngOnInit(): void {
  }

  navigateBack() {
    this.location.back();
  }

}
