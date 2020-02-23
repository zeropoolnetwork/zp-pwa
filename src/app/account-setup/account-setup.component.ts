import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-account-setup',
  templateUrl: './account-setup.component.html',
  styleUrls: ['./account-setup.component.scss']
})
export class AccountSetupComponent implements OnInit {

  constructor() {
    console.log('hi');
  }

  ngOnInit(): void {
  }

  next() {
    // navigate to main or enter mnemonic
  }
}
