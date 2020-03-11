import { Injectable } from '@angular/core';
import { exhaustMap, filter, map, mergeMap, shareReplay, take, tap } from 'rxjs/operators';
import { BehaviorSubject, combineLatest, Observable, of, timer } from 'rxjs';
import { fromPromise } from 'rxjs/internal-compatibility';
import { ZeroPoolService } from './zero-pool.service';
import { RelayerApiService } from './relayer.api.service';
import { PayNote, toHex, Tx, ZeroPoolNetwork } from 'zeropool-lib';
import { environment } from '../../environments/environment';
import { UnconfirmedTransactionService } from './unconfirmed-transaction.service';
import { TransactionSynchronizer } from './observable-synchronizer';
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
          UnconfirmedTransactionService.saveDepositTransaction({ tx, txHash });
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
            mergeMap((txData: any) => {
              progressCallback('receipt-tx-data');
              return this.updateState$(this.zpService.zp, txData, progressCallback);
            })
          );
        }
      )
    );

    return TransactionSynchronizer.execute<string>({ observable: o$, progressCallback });
  }

  public gasDeposit(amount: number, progressCallback: (msg) => void): Observable<string> {
    const o$ = this.isReady$.pipe(
      mergeMap(() => {
        progressCallback('generate-transaction');
        return fromPromise(this.zpService.zpGas.prepareDeposit(environment.ethToken, amount, progressCallback));
      }),
      mergeMap(
        (zpTxData: [Tx<string>, string]) => {
          return this.relayerApi.getRelayerAddress$().pipe(
            mergeMap(
              (address: string) => {

                progressCallback('open-metamask');
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

                return this.waitForTx(this.zpService.zp, txHash);
              }
            ),
            filter(x => !!x),
            take(1),
            mergeMap((txHash: string) => {
              progressCallback('wait-for-zp-block');

              return this.relayerApi.gasDonation$(zpTxData[0], txHash).pipe(
                mergeMap((txData: any) => {
                  progressCallback('receipt-tx-data');
                  return this.updateState$(this.zpService.zpGas, txData, progressCallback);
                })
              );
            })
          );
        })
    );

    return TransactionSynchronizer.execute<string>({ observable: o$, progressCallback });
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
            mergeMap((txData: any) => {
              progressCallback && progressCallback('receipt-tx-data');
              return this.updateState$(this.zpService.zp, txData, progressCallback);
            })
          );
        }
      ),
      take(1)
    );

    return TransactionSynchronizer.execute<string>({ observable: o$, progressCallback });
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
            mergeMap((txData: any) => {
              progressCallback && progressCallback('receipt-tx-data');
              return this.updateState$(this.zpService.zp, txData, progressCallback);
            })
          );
        }
      )
    );

    return TransactionSynchronizer.execute<string>({ observable: o$, progressCallback });
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

  private updateState$ = (zp: ZeroPoolNetwork, tx: any, progressCallback?: (msg: any) => void): Observable<string> => {

    return this.waitForTx(zp, tx.transactionHash || tx).pipe(
      filter(x => !!x),
      take(1),
      tap(() => {
        progressCallback && progressCallback('transaction-confirmed');
      }),
      exhaustMap(() => {
        const updateZpBalance$ = fromPromise(
          this.zpService.zp.getBalanceAndHistory()
        );

        const updateGasZpBalance = fromPromise(
          this.zpService.zpGas.getBalanceAndHistory()
        );

        return combineLatest([updateZpBalance$, updateGasZpBalance])
          .pipe(
            map(() => {
              return tx.transactionHash || tx;
            })
          );
      })
    );

  };


  private waitForTx(zp: ZeroPoolNetwork, txHash: string): Observable<string> {

    const txReceipt = new BehaviorSubject(undefined);
    const txReceipt$ = txReceipt.asObservable();

    const onTxReceipt = (err: any, tx: TransactionReceipt) => {

      if (err) {
        console.log(err);
      }

      if (tx && tx.blockNumber) {
        txReceipt.next(tx);
      }

    };

    const timer$ = timer(0, 5000).pipe(
      exhaustMap(() => {
        return fromPromise(zp.ZeroPool.web3Ethereum.getTransactionReceipt(txHash, onTxReceipt))
          .pipe(take(1));
      })
    ).subscribe();

    return txReceipt$.pipe(
      filter(x => !!x),
      map((tx: TransactionReceipt) => {
        timer$.unsubscribe();
        return tx.transactionHash;
      })
    );

  }

}

