import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { getEthereumAddress, getKeyPair } from 'zeropool-lib';


export function toAddressPreview(address: string): string {
  return address.substring(0, 8) + '...' + address.substring(address.length - 8, address.length);
}

export interface IAccount {
  // readonly ethereumAddress: string;
  // readonly ethereumAddressPreview: string;
  //
  readonly zeropoolMnemonic: string;
  readonly zeropoolAddress: string;
  readonly zeropoolAddressPreview: string;
}

@Injectable({
  providedIn: 'root'
})
export class AccountService {
  account$: Observable<IAccount>;

  // public ethereumAddress: string;

  constructor() {

    const zeropoolMnemonic = 'salute grocery glass box cloth pull wedding measure bright tilt shield over';
    const { publicKey } = getKeyPair(zeropoolMnemonic);
    const zeropoolAddress = `0x` + publicKey.toString(16);

    const account: IAccount = {
      //
      // ethereumAddress: this.ethereumAddress,
      // ethereumAddressPreview: toAddressPreview(this.ethereumAddress),
      //
      zeropoolMnemonic,
      zeropoolAddress,
      zeropoolAddressPreview: toAddressPreview(zeropoolAddress),
    };
    //

    this.account$ = of(account);
    // this.account$ = of({ethereumPrivateKey: '', ethereumAddress: '', zeropoolMnemonic: '', zeropoolAddress: ''});
  }
}
