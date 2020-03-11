import { Injectable } from '@angular/core';
import { exhaustMap, filter, map, mergeMap, shareReplay, take } from 'rxjs/operators';
import { combineLatest, Observable, of, Subject, timer } from 'rxjs';
import { fromPromise } from 'rxjs/internal-compatibility';
import { ZeroPoolService } from './zero-pool.service';
import { RelayerApiService } from './relayer.api.service';
import { PayNote, toHex, Tx } from 'zeropool-lib';
import { environment } from '../../environments/environment';
import { UnconfirmedTransactionService } from './unconfirmed-transaction.service';
import { TransactionSyncronizer } from './observable-synchronizer';
import { TransactionReceipt } from 'web3-core';

const waitBlocks = 1;

type TxContainer = [Tx<string>, string];

@Injectable({
  providedIn: 'root'
})
export class TransactionService {

  private isReady$: Observable<boolean> =
    this.zpService.isReady$.pipe(
      filter((isZpReady: boolean) => isZpReady),
      take(1),
      shareReplay(1),
    );

  constructor(
    protected zpService: ZeroPoolService,
    protected relayerApi: RelayerApiService
  ) {
  }

  public deposit(
    token: string,
    amount: number,
    fee: number,
    progressCallback: (msg) => void
  ): Observable<string> {

    const o$ = this.isReady$.pipe(
      mergeMap(() => {
        return fromPromise(this.zpService.zp.prepareDeposit(token, amount, progressCallback));
      }),
      mergeMap(
        ([tx, txHash]: [Tx<string>, string]) => {
          UnconfirmedTransactionService.saveDepositTransaction({
            tx,
            txHash: txHash
          });
          progressCallback('open-metamask');
          const depositBlockNumber$ = fromPromise(this.zpService.zp.deposit(token, amount, txHash));
          const gasTx$ = fromPromise(this.zpService.zpGas.prepareWithdraw(environment.ethToken, fee));
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
      )
    );

    return TransactionSyncronizer.execute<string>({ observable: o$, progressCallback });
  }

  public gasDeposit(amount: number, progressCallback: (msg) => void): Observable<string> {
    const o$ = this.isReady$.pipe(
      mergeMap(() => {
        return fromPromise(this.zpService.zpGas.prepareDeposit(environment.ethToken, amount, progressCallback));
      }),
      mergeMap(
        (zpTxData: [Tx<string>, string]) => {
          return this.relayerApi.getRelayerAddress$().pipe(
            mergeMap(
              (address: string) => {

                const tx$ = this.zpService.zp.ZeroPool.web3Ethereum.sendTransaction(address, amount, undefined, 0);
                return fromPromise(tx$).pipe(
                  map((txData: any) => txData.transactionHash || txData)
                );

              }
            ),
            mergeMap(
              (txHash: string) => {
                UnconfirmedTransactionService.saveGasDepositTransaction({
                  tx: zpTxData[0],
                  txHash
                });

                return this.waitForTx(txHash).pipe(
                  filter(x => !!x),
                );
              }
            ),
            mergeMap((txHash: string) => {
              progressCallback('wait-for-zp-block');

              return this.relayerApi.gasDonation$(zpTxData[0], txHash).pipe(
                mergeMap(this.updateState$)
              );
            })
          );
        })
    );

    return TransactionSyncronizer.execute<string>({ observable: o$, progressCallback });
  }

  public transfer(
    token: string,
    to: string,
    amount: number,
    fee: number,
    progressCallback?: (msg) => void
  ): Observable<string> {

    const o$ = this.isReady$.pipe(
      mergeMap(() => {

        progressCallback && progressCallback('generate-zp-tx');

        const gasTx$ = fromPromise(this.zpService.zpGas.prepareWithdraw(environment.ethToken, fee));
        const tx$ = fromPromise(this.zpService.zp.transfer(token, to, amount, progressCallback));

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
      ),
      take(1)
    );

    return TransactionSyncronizer.execute<string>({ observable: o$, progressCallback });
  }

  public prepareWithdraw(token: string, amount: number, fee: number, progressCallback?: (msg) => void): Observable<string> {
    const o$ = this.isReady$.pipe(
      mergeMap(() => {
        if (progressCallback) {
          progressCallback('generate-zp-tx');
        }

        const tx$ = fromPromise(this.zpService.zp.prepareWithdraw(token, amount, progressCallback));
        const gasTx$ = fromPromise(this.zpService.zpGas.prepareWithdraw(environment.ethToken, fee));

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

    return TransactionSyncronizer.execute<string>({ observable: o$, progressCallback });
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


  private waitForTx(txHash: string): Observable<string> {

    const txReceipt = new Subject();
    const txReceipt$ = txReceipt.asObservable();

    const onTxReceipt = (err: any, tx: TransactionReceipt) => {

      if (err) {
        console.log(err);
      }

      if (tx && tx.blockNumber) {
        txReceipt.next(tx);
      }

    };

    const waitTx$ = fromPromise(this.zpService.zp.ZeroPool.web3Ethereum.getTransactionReceipt(txHash, onTxReceipt));

    timer(0, 5000).pipe(
      exhaustMap(() => {
        return waitTx$.pipe(take(1));
      }),
    ).subscribe();

    return txReceipt$.pipe(
      map((tx: TransactionReceipt) => {
        return tx.transactionHash;
      })
    );

  }

}

