import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MainRoutingModule } from './main-routing.module';
import { MainComponent } from './main.component';
import { DepositComponent } from './deposit/deposit.component';
import { TransferComponent } from './transfer/transfer.component';
import { WithdrawComponent } from './withdraw/withdraw.component';


@NgModule({
  declarations: [MainComponent, DepositComponent, TransferComponent, WithdrawComponent],
  imports: [
    CommonModule,
    MainRoutingModule
  ]
})
export class MainModule { }
