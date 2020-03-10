import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { getBabyJubKeyPair } from 'zeropool-lib';
import { filter, map, shareReplay } from 'rxjs/operators';
import { isValidMnemonic } from '../account-setup/hd-wallet.utils';


export function toAddressPreview(address: string): string {
  return address.substring(0, 6) + '...' + address.substring(address.length - 4, address.length);
}

export interface IAccount {
  readonly zeropoolMnemonic: string;
  readonly zeropoolAddress: string;
  readonly zeropoolAddressPreview: string;
}

@Injectable({
  providedIn: 'root'
})
export class AccountService {

  private mnemonic$ = new BehaviorSubject<string>(localStorage.mnemonic);
  account$: Observable<IAccount>;

  constructor() {

    this.account$ = this.mnemonic$.pipe(
      filter(m => {
          return m && isValidMnemonic(m);
        }
      ),
      map((mnemonic: string) => {
        // const zeropoolMnemonic = 'session oppose search lunch cave enact quote wire debate knee noble drama exit way scene';
        const {publicKey} = getBabyJubKeyPair(mnemonic);

        const zeropoolAddress = `0x` + publicKey.toString(16).padStart(64, '0');

        const account: IAccount = {
          zeropoolMnemonic: mnemonic,
          zeropoolAddress,
          zeropoolAddressPreview: toAddressPreview(zeropoolAddress),
        };

        return account;
      }),
      shareReplay(1)
    );
  }

  setNewAccountFlag(): void {
    localStorage.setItem('new-account', 'true');
  }

  deleteNewAccountFlag(): void {
    localStorage.removeItem('new-account');
  }

  isNewAccount(): boolean {
    return localStorage.getItem('new-account') === 'true';
  }

  setMnemonic(mnemonic: string): void {
    localStorage.setItem('mnemonic', mnemonic);
    this.mnemonic$.next(mnemonic);
  }

}
