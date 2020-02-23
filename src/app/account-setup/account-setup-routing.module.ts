import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AccountSetupComponent } from './account-setup.component';

const routes: Routes = [{ path: '', component: AccountSetupComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AccountSetupRoutingModule { }
