import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-dust-protection',
  templateUrl: './dust-protection.component.html',
  styleUrls: ['./dust-protection.component.scss']
})
export class DustProtectionComponent implements OnInit {

  public protectionForm: FormGroup = this.fb.group({
    maxGasFee: [''],
    minUtxoSize: [''],
  });

  get maxGasFee(): number {
    return this.protectionForm.get('maxGasFee').value;
  }

  get minUtxoSize(): number {
    return this.protectionForm.get('minUtxoSize').value;
  }

  constructor(
    private fb: FormBuilder
  ) {
  }

  ngOnInit(): void {
  }

}
