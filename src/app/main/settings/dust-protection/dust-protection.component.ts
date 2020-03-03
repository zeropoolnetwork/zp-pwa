import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-dust-protection',
  templateUrl: './dust-protection.component.html',
  styleUrls: ['./dust-protection.component.scss']
})
export class DustProtectionComponent implements OnInit {

  enable: boolean;

  public protectionForm: FormGroup = this.fb.group({
    maxGasFee: ['', [Validators.required]],
    minUtxoSize: ['', [Validators.required]],
    activate: [false, [Validators.requiredTrue]],
  });

  get maxGasFee(): string {
    return (
      BigInt(this.protectionForm.get('maxGasFee').value) * (10n ** 9n)
    ).toString();
  }

  get minUtxoSize(): string {
    return (
      BigInt(this.protectionForm.get('minUtxoSize').value) * (10n ** 9n)
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
