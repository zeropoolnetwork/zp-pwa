import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { getEthereumAddress, getKeyPair } from 'zeropool-lib';

export interface IAccount {
  // Hex encoded start private key '0x' prefix is optional
  readonly ethereumPrivateKey: string;
  readonly ethereumAddress: string;
  //
  readonly zeropoolMnemonic: string;
  readonly zeropoolAddress: string;
}

@Injectable({
  providedIn: 'root'
})
export class AccountService {
  account$: Observable<IAccount>;

  constructor() {

    const ethereumPrivateKey = '0x896bdb64b1ca1458a61323416f5d4ba1a96278c894f83059b02642d094a21c63';
    const ethereumAddress = getEthereumAddress(ethereumPrivateKey);

    const zeropoolMnemonic = 'salute grocery glass box cloth pull wedding measure bright tilt shield over';
    const {publicKey} = getKeyPair(zeropoolMnemonic);
    const zeropoolAddress = `0x` + publicKey.toString(16);

    const account: IAccount = {
      //
      ethereumPrivateKey,
      ethereumAddress,
      //
      zeropoolMnemonic,
      zeropoolAddress
    };
    //

    this.account$ = of(account);
    // this.account$ = of({ethereumPrivateKey: '', ethereumAddress: '', zeropoolMnemonic: '', zeropoolAddress: ''});
  }
}
