import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MainRoutingModule } from './main-routing.module';
import { MainComponent } from './main.component';
import { DepositComponent } from './deposit/deposit.component';
import { TransferComponent } from './transfer/transfer.component';
import { WithdrawComponent } from './withdraw/withdraw.component';
import { SettingsComponent } from './settings/settings.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxLoadersCssModule } from 'ngx-loaders-css';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { RelayerApiService } from '../services/relayer.api.service';
import { HttpClientModule } from '@angular/common/http';
import { InputAmountModule } from '../common/input-amount/input-amount.module';
import { InputZpAddressModule } from '../common/input-zp-address/input-zp-address.module';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { PayForGasComponent } from './pay-for-gas/pay-for-gas.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ClipboardModule } from '@angular/cdk/clipboard';

@NgModule({
  declarations: [
    MainComponent,
    DepositComponent,
    TransferComponent,
    WithdrawComponent,
    PayForGasComponent,
    SettingsComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    MainRoutingModule,
    NgxLoadersCssModule,
    //
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDividerModule,
    MatSnackBarModule,
    MatIconModule,
    ReactiveFormsModule,
    MatTooltipModule,
    MatProgressBarModule,
    MatCheckboxModule,
    ClipboardModule,

    HttpClientModule,
    InputAmountModule,
    InputZpAddressModule
  ],
  providers: [
    RelayerApiService
  ]
})
export class MainModule {
}
