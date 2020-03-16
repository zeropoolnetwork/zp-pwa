import { Injectable } from '@angular/core';
import { ZeroPoolService } from './zero-pool.service';
import { AutoJoinUtxoService } from './auto-join-utxo.service';
import { UnconfirmedTransactionService } from './unconfirmed-transaction.service';

@Injectable({
  providedIn: 'root'
})
export class BackgroundService {

  constructor(
    private zpService: ZeroPoolService,
    private autoJoinService: AutoJoinUtxoService,
    private unconfirmedTxService: UnconfirmedTransactionService
  ) {

    this.zpService.start$.subscribe();

    this.autoJoinService.start$.subscribe();

    this.unconfirmedTxService.startDepositSearch$.subscribe();

    this.unconfirmedTxService.startGasDepositSearch$.subscribe();

  }

}
