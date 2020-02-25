import { Component, forwardRef, Input } from '@angular/core';
import { AbstractControl, ControlValueAccessor, NG_VALIDATORS, NG_VALUE_ACCESSOR, Validator, } from '@angular/forms';

@Component({
  selector: 'app-zp-address-input',
  templateUrl: './input-zp-address.component.html',
  styleUrls: ['./input-zp-address.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputZpAddressComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => InputZpAddressComponent),
      multi: true,
    }]
})
export class InputZpAddressComponent implements ControlValueAccessor, Validator {

  @Input()
  placeholder: string;

  @Input()
  label: string;

  private address = '';

  constructor() {
  }

  onChange(event) {
    this.writeValue(event.target.value);
    this.propagateChange(event.target.value);
  }

  onTouched() {
  }

  writeValue(val: string): void {
    if (val.length === 64) {
      this.address = '0x' + val;
      return;
    }

    this.address = val;
  }

  validate(control: AbstractControl): { [key: string]: any } | null {
    if (this.address.length !== 66) {
      return { badLength: { value: control.value } };
    } else if (!/0[xX][0-9a-fA-F]+/.test(this.address)) {
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
  };
}
