import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, Validators } from '@angular/forms';
import { ValidateMnemonic } from './mnemonic.validator';
import { generateMnemonic } from './hd-wallet.utils';
import { Router } from '@angular/router';

@Component({
  selector: 'app-account-setup',
  templateUrl: './account-setup.component.html',
  styleUrls: ['./account-setup.component.scss']
})
export class AccountSetupComponent implements OnInit {

  constructor(private router: Router) {
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

  ngOnInit(): void {
  }

  next() {
    localStorage.setItem('mnemonic', this.mnemonic.value);
    this.router.navigate(['/main']);
  }

  generateNew() {
    const m = generateMnemonic();
    this.mnemonicForm.controls.mnemonic.setValue(m);
  }
}
