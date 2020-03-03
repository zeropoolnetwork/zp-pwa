import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-dust-protection',
  templateUrl: './dust-protection.component.html',
  styleUrls: ['./dust-protection.component.scss']
})
export class DustProtectionComponent implements OnInit {

  enable: boolean;

  public form: FormGroup = this.fb.group({
    maxGasFee: [32000, [Validators.required]],
    minUtxoSize: [320, [Validators.required]],
    activate: [true, [Validators.requiredTrue]],
  });

  get maxGasFee(): string {
    return (
      BigInt(this.form.get('maxGasFee').value) * (10n ** 9n)
    ).toString();
  }

  get minUtxoSize(): string {
    return (
      BigInt(this.form.get('minUtxoSize').value) * (10n ** 9n)
    ).toString();
  }

  constructor(
    private fb: FormBuilder
  ) {
  }

  ngOnInit(): void {
  }

  saveSettings() {

  }

}
