import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AccountSetupRoutingModule } from './account-setup-routing.module';
import { AccountSetupComponent } from './account-setup.component';
import { MatButtonModule } from '@angular/material/button';
import { TextFieldModule } from '@angular/cdk/text-field';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [AccountSetupComponent],
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    TextFieldModule,
    AccountSetupRoutingModule,
    ReactiveFormsModule,
  ]
})
export class AccountSetupModule {
}
