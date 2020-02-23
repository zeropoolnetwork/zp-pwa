import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';

@Component({
  selector: 'app-withdraw',
  templateUrl: './withdraw.component.html',
  styleUrls: ['./withdraw.component.scss']
})
export class WithdrawComponent implements OnInit {

  constructor(private location: Location) {
  }

  ngOnInit(): void {
  }

  navigateBack() {
    this.location.back();
  }


}
