import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';

@Component({
  selector: 'app-transfer',
  templateUrl: './transfer.component.html',
  styleUrls: ['./transfer.component.scss']
})
export class TransferComponent implements OnInit {

  constructor(private location: Location) {
  }

  ngOnInit(): void {
  }

  navigateBack() {
    this.location.back();
  }


}
