import { AbstractControl } from '@angular/forms';

export function ValidateAddress(control: AbstractControl) {

    if (this.address.length !== 66) {
        return {
            badLength: {
                value: control.value
            }
        };
    }

    if (!/0[xX][0-9a-fA-F]+/.test(this.address)) {
        return {
            badSymobol: {
                value: control.value
            }
        };
    }
    return null;
}
