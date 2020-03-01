import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {

  confirmed = false;
  constructor() { }

  ngOnInit(): void {
  }

  resetAccount() {
    // TODO: clear local storag
  }
}
