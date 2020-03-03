import { Injectable } from '@angular/core';
import { filter, map, mergeMap, tap } from 'rxjs/operators';
import { combineLatest, Observable, of } from 'rxjs';
import { fromPromise } from 'rxjs/internal-compatibility';
import { ZeroPoolService } from './zero-pool.service';
import { RelayerApiService } from './relayer.api.service';
import { PayNote, toHex, Tx } from 'zeropool-lib';
import { Transaction } from 'web3-core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TransactionService {

  isZpReady$: Observable<boolean>;

  constructor(
    private zpService: ZeroPoolService,
    private relayerApi: RelayerApiService
  ) {
    this.isZpReady$ = this.zpService.isReady$.pipe(
      filter((isReady: boolean) => isReady)
    );
  }

  public deposit(token: string, amount: number, fee: number,
                 progressCallback: (msg) => void): Observable<string> {
    return this.isZpReady$.pipe(
      mergeMap(() => {
        return fromPromise(this.zpService.zp.prepareDeposit(token, amount));
      }),
      mergeMap(
        ([tx, txHash]: [Tx<string>, string]) => {
          progressCallback('open-metamask');
          const depositBlockNumber$ = fromPromise(this.zpService.zp.deposit(token, amount, txHash));
          const gasTx$ = fromPromise(this.zpService.zpGas.prepareWithdraw(environment.ethToken, fee));
          const tx$ = of(tx);
          return combineLatest([tx$, depositBlockNumber$, gasTx$]);
        }
      ),
      mergeMap(
        ([tx, depositBlockNumber, gasTx]: [Tx<string>, number, [Tx<string>, string]]) => {
          progressCallback('sending-transaction');
          return this.relayerApi.sendTx$(tx, toHex(depositBlockNumber), gasTx[0]);
        }
      ),
      map(
        (tx: any) => {
          return tx.transactionHash;
        }
      )
    );
  }

  public gasDeposit(amount: number): Observable<string> {
    return this.isZpReady$.pipe(
      mergeMap(() => {
        return this.relayerApi.getRelayerAddress$();
      }),
      mergeMap(
        (address: string) => {
          //
          const zpTxData$ = fromPromise(this.zpService.zpGas.prepareDeposit(environment.ethToken, amount));

          // Check metamask
          const p$ = this.zpService.zp.ZeroPool.web3Ethereum.sendTransaction(address, amount);
          const txHash$ = fromPromise(p$).pipe(
            map((txData: any) => txData.transactionHash)
          );

          return combineLatest([zpTxData$, txHash$]);
        }
      ),
      mergeMap(
        (x: any[]) => {
          // Wait for ZeroPool block
          const [zpTxData, txHash] = x;
          return this.relayerApi.gasDonation$(zpTxData[0], txHash);
        }
      ),
      map(
        (txData: any) => txData.transactionHash
      )
    );
  }

  public transfer(token: string, to: string, amount: number, fee: number): Observable<string> {

    return this.isZpReady$.pipe(
      mergeMap(
        () => {
          // Generate ZP transaction
          const gasTx$ = fromPromise(this.zpService.zpGas.prepareWithdraw(environment.ethToken, fee));
          const tx$ = fromPromise(this.zpService.zp.transfer(token, to, amount));
          return combineLatest([tx$, gasTx$]);
        }
      ),
      mergeMap(
        ([tx, gasTx]: [[Tx<string>, string], [Tx<string>, string]]) => {
          // Transaction is sent,
          // Wait for ZeroPool block
          return this.relayerApi.sendTx$(tx[0], '0x0', gasTx[0]);
        }
      ),
      map(
        (txData: any) => {
          // Done
          return txData.transactionHash;
        }
      )
    );
  }

  public prepareWithdraw(token: string, amount: number, fee: number) {
    return this.isZpReady$.pipe(
      mergeMap(() => {
          // Generate ZP transaction
          const gasTx$ = fromPromise(this.zpService.zpGas.prepareWithdraw(environment.ethToken, fee));
          const tx$ = fromPromise(this.zpService.zp.prepareWithdraw(token, amount));
          return combineLatest([tx$, gasTx$]);
        }
      ),
      mergeMap(
        ([tx, gasTx]: [[Tx<string>, string], [Tx<string>, string]]) => {
          // Wait for ZeroPool block
          return this.relayerApi.sendTx$(tx[0], '0x0', gasTx[0]);
        }
      ),
      map(
        (txData: any) => {
          return txData.transactionHash;
        }
      )
    );
  }

  public withdraw(w: PayNote): Observable<string> {
    return this.isZpReady$.pipe(
      mergeMap(() => {
        // Open Metamask
        return fromPromise(this.zpService.zp.withdraw(w));
      }),
      map(
        (txData: any) => {
          return txData.transactionHash;
        }
      )
    );
  }


}

