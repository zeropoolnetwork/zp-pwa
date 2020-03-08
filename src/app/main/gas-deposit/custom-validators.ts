import { AbstractControl, ValidationErrors } from '@angular/forms';

export type AmountValidatorParams = {
  availableAmount?: Number;
  maxAmount?: Number;
  minAmount?: Number;
}

export class CustomValidators {

  static amount(params: AmountValidatorParams) {
    return (control: AbstractControl): ValidationErrors | null => {
      const {availableAmount, minAmount, maxAmount} = params;
      const num = control.value;

      if (num < minAmount) {
        return {'min': true};
      }

      if (num > maxAmount) {
        return {'max': true};
      }

      if (num > availableAmount) {
        return {'notEnough': true};
      }

      console.log(availableAmount);

      return null;
    };
  }

}
