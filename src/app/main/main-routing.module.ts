import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { MainComponent } from './main.component';
import { DepositComponent } from './deposit/deposit.component';
import { TransferComponent } from './transfer/transfer.component';
import { WithdrawComponent } from './withdraw/withdraw.component';
import { NgxLoadersCssModule } from 'ngx-loaders-css';
import { WelcomeComponent } from '../welcome/welcome.component';

const routes: Routes = [
  {path: '', component: MainComponent},
  {path: 'deposit', component: DepositComponent},
  {path: 'transfer', component: TransferComponent},
  {path: 'withdraw', component: WithdrawComponent}
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
