import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { WelcomeComponent } from './welcome/welcome.component';
import { ConnectWalletComponent } from './connect-wallet/connect-wallet.component';
import { AccountGuard } from './account.guard';
import { SelectNetworkComponent } from './select-network/select-network.component';

const routes: Routes = [
  {path: '',  redirectTo: '/main', pathMatch: 'full'},
  {path: 'welcome', component: WelcomeComponent},
  {path: 'account-setup', loadChildren: () => import('./account-setup/account-setup.module').then(m => m.AccountSetupModule)},
  {path: 'connect-wallet', component: ConnectWalletComponent},
  {path: 'select-network', component: SelectNetworkComponent},
  {
    path: 'main',
    canActivate: [ AccountGuard ],
    loadChildren: () => import('./main/main.module').then(m => m.MainModule)
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
