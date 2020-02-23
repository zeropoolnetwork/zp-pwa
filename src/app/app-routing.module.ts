import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { WelcomeComponent } from './welcome/welcome.component';

const routes: Routes = [
  {path: 'main', loadChildren: () => import('./main/main.module').then(m => m.MainModule)},
  {path: 'welcome', component: WelcomeComponent},
  {path: 'account-setup', loadChildren: () => import('./account-setup/account-setup.module').then(m => m.AccountSetupModule)},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
