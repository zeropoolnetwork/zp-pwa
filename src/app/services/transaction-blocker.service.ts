import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TransactionBlockerService {

  private transactionLock: BehaviorSubject<boolean> = new BehaviorSubject(false);
  public transactionLock$: Observable<boolean> = this.transactionLock.asObservable();

  constructor() {
  }

  saveLastTxHash(txHash: string): void {
    localStorage.setItem('last-tx-hash', txHash);
  }

  getLastTxHash(): string | null {
    return localStorage.getItem('last-tx-hash');
  }

  lockTransactionSend(): void {
    this.transactionLock.next(true);
  }

  unlockTransactionSend(): void {
    this.transactionLock.next(false);
  }

  isAllowedToSendTransaction(): boolean {
    return this.transactionLock.value;
  }

}
