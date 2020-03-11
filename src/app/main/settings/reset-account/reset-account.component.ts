import { Component, OnInit } from '@angular/core';
import { StateStorageService } from '../../../services/state.storage.service';

@Component({
  selector: 'app-reset-account',
  templateUrl: './reset-account.component.html',
  styleUrls: ['./reset-account.component.scss']
})
export class ResetAccountComponent {

  confirmed = false;

  constructor(private stateService: StateStorageService) {
  }

  resetAccount() {
    localStorage.removeItem('mnemonic');
    localStorage.removeItem('deposit');
    localStorage.removeItem('gas-deposit');
    this.stateService.resetStorage()
      .subscribe(() => {
        location.reload();
      });
  }

}
