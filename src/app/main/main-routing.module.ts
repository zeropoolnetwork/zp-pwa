import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { MainComponent } from './main.component';
import { DepositComponent } from './deposit/deposit.component';
import { TransferComponent } from './transfer/transfer.component';
import { WithdrawComponent } from './withdraw/withdraw.component';
import { SettingsComponent } from './settings/settings.component';
import { NgxLoadersCssModule } from 'ngx-loaders-css';
import { PayForGasComponent } from './pay-for-gas/pay-for-gas.component';

const routes: Routes = [
  {path: '', component: MainComponent},
  {path: 'pay-for-gas', component: PayForGasComponent},
  {path: 'deposit', component: DepositComponent},
  {path: 'transfer', component: TransferComponent},
  {path: 'withdraw', component: WithdrawComponent},
  {path: 'settings', component: SettingsComponent}
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
