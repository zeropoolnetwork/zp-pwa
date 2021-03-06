import { Component } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, Validators } from '@angular/forms';
import { ValidateMnemonic } from './mnemonic.validator';
import { generateMnemonic } from './hd-wallet.utils';
import { Router } from '@angular/router';
import { AccountService } from '../services/account.service';

@Component({
  selector: 'app-account-setup',
  templateUrl: './account-setup.component.html',
  styleUrls: ['./account-setup.component.scss']
})
export class AccountSetupComponent {

  private autoGenMnemonic = '';

  constructor(private router: Router, private accountService: AccountService) {
    //
  }

  mnemonicForm = new FormGroup({
    mnemonic: new FormControl('', [
      Validators.required,
      ValidateMnemonic
    ])
  });

  get mnemonic(): AbstractControl {
    return this.mnemonicForm.controls.mnemonic;
  }

  next() {
    this.accountService.setMnemonic(this.mnemonic.value);
    if (this.autoGenMnemonic === this.mnemonic.value) {
      this.accountService.setNewAccountFlag();
    }
    this.router.navigate(['/main']);
  }

  generateNew() {
    const m = generateMnemonic();
    this.autoGenMnemonic = m;
    this.mnemonicForm.controls.mnemonic.setValue(m);
  }

}
