import { Component, OnInit } from '@angular/core';
import { StateStorageService } from '../../services/state.storage.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent {

  confirmed = false;

  constructor(private stateService: StateStorageService) {
  }

  resetAccount() {
    this.stateService.resetStorage()
      .subscribe(() => {
        location.reload();
      });
  }
}
