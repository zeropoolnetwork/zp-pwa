import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { MainComponent } from './main.component';
import { DepositComponent } from './deposit/deposit.component';
import { TransferComponent } from './transfer/transfer.component';
import { WithdrawComponent } from './withdraw/withdraw.component';
import { SettingsComponent } from './settings/settings.component';
import { NgxLoadersCssModule } from 'ngx-loaders-css';
import { GasIsNeededComponent } from './gas-is-needed/gas-is-needed.component';
import { WithdrawalsListComponent } from './withdrawals-list/withdrawals-list.component';
import { GasGuard } from './gas.guard';
import { GasDepositComponent } from './gas-deposit/gas-deposit.component';
import { DustProtectionComponent } from './settings/dust-protection/dust-protection.component';
import { ResetAccountComponent } from './settings/reset-account/reset-account.component';
import { DepositCancelComponent } from './deposit-cancel/deposit-cancel.component';

const routes: Routes = [
  { path: '', component: MainComponent },
  { path: 'gas-is-needed', component: GasIsNeededComponent },
  { path: 'gas-deposit', component: GasDepositComponent },
  { path: 'cancel-deposit', component: DepositCancelComponent },
  { path: 'deposit', component: DepositComponent, canActivate: [GasGuard] },
  { path: 'transfer', component: TransferComponent, canActivate: [GasGuard] },
  { path: 'withdraw', component: WithdrawComponent, canActivate: [GasGuard] },
  { path: 'withdrawals-list', component: WithdrawalsListComponent },
  { path: 'settings', component: SettingsComponent },
  { path: 'settings/reset', component: ResetAccountComponent },
  { path: 'settings/dust-protection', component: DustProtectionComponent }
];

@NgModule({
  imports: [
    NgxLoadersCssModule,
    RouterModule.forChild(routes)
  ],
  exports: [
    RouterModule
  ]
})
export class MainRoutingModule {
  //
}
