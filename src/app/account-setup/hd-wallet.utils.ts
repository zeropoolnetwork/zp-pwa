import { EnDict } from './wordlist.en';
import {entropyToMnemonic, validateMnemonic} from 'bip39';

export function hasStrongRandom(): boolean {
  return 'crypto' in window && window.crypto !== null;
}

export function uint8ArrayToHex(a: Uint8Array): string {
  let s = '';
  // tslint:disable-next-line:prefer-for-of
  for (let i = 0; i < a.length; i++) {
    let h = a[i].toString(16);
    while (h.length < 2) {
      h = '0' + h;
    }
    s = s + h;
  }
  return s;
}

export function generateMnemonic(numWords: number = 24): string {
  if (!hasStrongRandom()) {
    alert('This browser does not support strong randomness');
    return;
  }

  const strength = numWords / 3 * 32;

  // get the amount of entropy (bits) to use
  // words | strength
  // 12   -> 128 bit / 16 bytes
  // 15   -> 160 bit / 20 bytes
  // 18   -> 192 bit / 24 bytes
  // 21   -> 224 bit / 28 bytes
  // 24   -> 256 bit / 32 bytes
  const b = new Uint8Array(strength / 8);
  const entropy = crypto.getRandomValues(b);

  return entropyToMnemonic(uint8ArrayToHex(entropy), EnDict);
}


export function isValidMnemonic( phrase: string ): boolean {
  return validateMnemonic(phrase, EnDict);
}
