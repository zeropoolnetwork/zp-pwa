import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-gas-deposit',
  templateUrl: './gas-deposit.component.html',
  styleUrls: ['./gas-deposit.component.scss']
})
export class GasDepositComponent implements OnInit {

  isDone = false;
  form: FormGroup = this.fb.group({
    toAmount: [''],
    // toAddress: ['']
  });

  constructor(private fb: FormBuilder) {
  }

  ngOnInit(): void {
  }

  depositGas() {

  }
}
