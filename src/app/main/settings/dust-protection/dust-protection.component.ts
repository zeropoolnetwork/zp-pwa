import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AutoJoinUtxoService } from '../../../services/auto-join-utxo.service';

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

  get maxGasFee(): number {
    return Number((
      BigInt(this.form.get('maxGasFee').value) * (10n ** 9n)
    ));
  }

  get minUtxoSize(): number {
    return Number((
      BigInt(this.form.get('minUtxoSize').value) * (10n ** 9n)
    ));
  }

  constructor(
    private fb: FormBuilder,
    private autoJoinService: AutoJoinUtxoService
  ) {
  }

  ngOnInit(): void {
  }

  saveSettings() {
    this.autoJoinService.activateAutoJoin(
      this.maxGasFee,
      this.minUtxoSize
    );
  }

}
