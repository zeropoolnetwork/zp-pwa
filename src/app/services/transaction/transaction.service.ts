import { Injectable } from '@angular/core';
import { filter, map, mergeMap, shareReplay, take } from 'rxjs/operators';
import { combineLatest, Observable, of } from 'rxjs';
import { fromPromise } from 'rxjs/internal-compatibility';
import { ZeroPoolService } from '../zero-pool.service';
import { RelayerApiService } from '../relayer.api.service';
import { PayNote, toHex, Tx } from 'zeropool-lib';
import { environment } from '../../../environments/environment';
import { UnconfirmedTransactionService } from '../unconfirmed-transaction.service';
import { TransactionSynchronizer } from './transaction-synchronizer';


const waitBlocks = 1;

type TxContainer = [Tx<string>, string];

interface SyncronizerPair {
  zp: TransactionSynchronizer;
  zpGas: TransactionSynchronizer;
}

@Injectable({
  providedIn: 'root'
})
export class TransactionService {

  private syncronizer$: Observable<SyncronizerPair> =
    this.zpService.isReady$.pipe(
      filter((isReady: boolean) => isReady),
      take(1),
      map(() => {
        return {
          zp: new TransactionSynchronizer(this.zpService.zp),
          zpGas: new TransactionSynchronizer(this.zpService.zpGas),
        };
      }),
      shareReplay(1)
    );

  constructor(
    protected zpService: ZeroPoolService,
    protected relayerApi: RelayerApiService,
  ) {
  }

  public deposit(
    token: string,
    amount: number,
    fee: number,
    progressCallback: (msg) => void
  ): Observable<string> {

    return this.syncronizer$.pipe(
      mergeMap(({ zp, zpGas }) => {
        return zp.runTransaction({
          type: 'prepareDeposit',
          progressCallback,
          amount,
          token
        }).pipe(
          mergeMap(
            ([tx, txHash]: [Tx<string>, string]) => {
              UnconfirmedTransactionService.saveDepositTransaction({
                tx,
                zpTxHash: txHash
              });
              progressCallback('open-metamask');
              const depositBlockNumber$ = fromPromise(this.zpService.zp.deposit(token, amount, txHash));
              const gasTx$ = zpGas.runTransaction({
                type: 'prepareWithdraw',
                token: environment.ethToken,
                amount: fee
              });
              const tx$ = of(tx);
              return combineLatest([tx$, depositBlockNumber$, gasTx$]);
            }
          ),
          mergeMap(
            ([tx, depositBlockNumber, gasTx]: [Tx<string>, number, TxContainer]) => {
              progressCallback('sending-transaction');
              return this.relayerApi.sendTx$(tx, toHex(depositBlockNumber), gasTx[0]).pipe(
                mergeMap(this.updateState$)
              );
            }
          ),
        );
      })
    );
  }

  public gasDeposit(amount: number, progressCallback: (msg) => void): Observable<string> {
    return this.syncronizer$.pipe(
      mergeMap(({ zp, zpGas }) => {
        return this.relayerApi.getRelayerAddress$().pipe(
          mergeMap(
            (address: string) => {

              const zpTxData$ = zpGas.runTransaction({
                type: 'prepareDeposit',
                progressCallback,
                amount,
                token: environment.ethToken
              });
              // Check metamask
              const p$ = this.zpService.zp.ZeroPool.web3Ethereum.sendTransaction(address, amount, undefined, waitBlocks);
              const txHash$ = fromPromise(p$).pipe(
                map((txData: any) => txData.transactionHash || txData)
              );

              return combineLatest([zpTxData$, txHash$]);
            }
          ),
          mergeMap(
            (x: any[]) => {
              progressCallback('wait-for-zp-block');

              const [zpTxData, txHash] = x;
              return this.relayerApi.gasDonation$(zpTxData[0], txHash).pipe(
                mergeMap(this.updateState$)
              );
            }
          )
        );
      })
    );
  }

  public transfer(
    token: string,
    to: string,
    amount: number,
    fee: number,
    progressCallback?: (msg) => void
  ): Observable<string> {

    return this.syncronizer$.pipe(
      mergeMap(({ zp, zpGas }) => {

        if (progressCallback) {
          progressCallback('generate-zp-tx');
        }

        const gasTx$ = zpGas.runTransaction({
          type: 'prepareWithdraw',
          token: environment.ethToken,
          amount: fee
        });

        const tx$ = zp.runTransaction({
          type: 'transfer',
          token,
          to,
          amount,
          progressCallback
        });

        return combineLatest([tx$, gasTx$]);

      }),
      mergeMap(
        ([tx, gasTx]: [TxContainer, TxContainer]) => {
          if (progressCallback) {
            progressCallback('wait-for-zp-block');
          }
          // Transaction is sent,
          // Wait for ZeroPool block
          return this.relayerApi.sendTx$(tx[0], '0x0', gasTx[0]).pipe(
            mergeMap(this.updateState$)
          );
        }
      )
    );
  }

  public prepareWithdraw(token: string, amount: number, fee: number, progressCallback?: (msg) => void): Observable<string> {
    return this.syncronizer$.pipe(
      mergeMap(({ zp, zpGas }) => {
        if (progressCallback) {
          progressCallback('generate-zp-tx');
        }

        const tx$ = zp.runTransaction({
          type: 'prepareWithdraw',
          token,
          amount,
          progressCallback
        });

        const gasTx$ = zpGas.runTransaction({
          type: 'prepareWithdraw',
          token: environment.ethToken,
          amount: fee
        });

        return combineLatest([tx$, gasTx$]);
      }),
      mergeMap(
        ([tx, gasTx]: [TxContainer, TxContainer]) => {
          if (progressCallback) {
            progressCallback('wait-for-zp-block');
          }
          // Wait for ZeroPool block
          return this.relayerApi.sendTx$(tx[0], '0x0', gasTx[0]).pipe(
            mergeMap(this.updateState$)
          );
        }
      )
    );
  }

  public withdraw(w: PayNote): Observable<string> {
    return this.zpService.isReady$.pipe(
      filter((isReady: boolean) => isReady),
      take(1),
      mergeMap(() => {
        // Open Metamask
        return fromPromise(this.zpService.zp.withdraw(w, waitBlocks));
      }),
      map(
        (txData: any) => {
          return txData.transactionHash || txData;
        }
      )
    );
  }

  public depositCancel(w: PayNote): Observable<string> {
    return this.zpService.isReady$.pipe(
      filter((isReady: boolean) => isReady),
      take(1),
      mergeMap(() => {
        // Open Metamask
        return fromPromise(this.zpService.zp.depositCancel(w, waitBlocks));
      }),
      map(
        (txData: any) => {
          return txData.transactionHash || txData;
        }
      )
    );
  }

  private updateState$ = (tx: any): Observable<string> => {
    const updateZpBalance$ = fromPromise(
      this.zpService.zp.getBalance()
    );

    const updateGasZpBalance = fromPromise(
      this.zpService.zpGas.getBalance()
    );

    return combineLatest([updateZpBalance$, updateGasZpBalance])
      .pipe(
        map(() => {
          return tx.transactionHash || tx;
        })
      );
  };

}

