import { Component, forwardRef } from '@angular/core';
import {
  AbstractControl,
  ControlValueAccessor,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  Validator, Validators,
} from '@angular/forms';

@Component({
  selector: 'app-amount-input',
  templateUrl: './input-amount.component.html',
  styleUrls: ['./input-amount.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputAmountComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => InputAmountComponent),
      multi: true,
    }]
})
export class InputAmountComponent implements ControlValueAccessor, Validator {

  private amount: string;

  constructor() {
  }

  onChange(event) {
    this.writeValue(event.target.value);
    this.propagateChange(event.target.value);
  }

  onTouched() {
  }

  writeValue(val: string): void {
    val.replace(',', '.');
    this.amount = val;
  }

  validate(control: AbstractControl): { [key: string]: any } | null {
    if (this.amount === '0' || this.amount === '') {
      return { zeroAmount: { value: control.value } };
    } else if (!/^[0-9]*[.,]?[0-9]+$/.test(this.amount)) {
      return { NAN: { value: control.value } };
    }
    return null;
  }

  registerOnChange(fn: any): void {
    this.propagateChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  private propagateChange = (_: any) => {
  }
}
