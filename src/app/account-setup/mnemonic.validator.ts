import { AbstractControl } from '@angular/forms';
import { isValidMnemonic } from './hd-wallet.utils';

export function ValidateMnemonic(control: AbstractControl) {
  if (control.value && !isValidMnemonic(control.value)) {
    return {invalidMnemonic: true};
  }
  return null;
}
