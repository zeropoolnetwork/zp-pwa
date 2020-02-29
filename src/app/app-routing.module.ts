import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { WelcomeComponent } from './welcome/welcome.component';
import { ConnectWalletComponent } from './connect-wallet/connect-wallet.component';

const routes: Routes = [
  {path: '', component: WelcomeComponent},
  {path: 'welcome', component: WelcomeComponent},
  {path: 'account-setup', loadChildren: () => import('./account-setup/account-setup.module').then(m => m.AccountSetupModule)},
  {path: 'connect-wallet', component: ConnectWalletComponent},
  {path: 'main', loadChildren: () => import('./main/main.module').then(m => m.MainModule)},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
