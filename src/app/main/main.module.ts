import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MainRoutingModule } from './main-routing.module';
import { MainComponent } from './main.component';
import { DepositComponent } from './deposit/deposit.component';
import { TransferComponent } from './transfer/transfer.component';
import { WithdrawComponent } from './withdraw/withdraw.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxLoadersCssModule } from 'ngx-loaders-css';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { TextFieldModule } from '@angular/cdk/text-field';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { Web3ProviderService } from '../web3.provider.service';
import { RelayerApiService } from '../relayer.api.service';
import { ZeroPoolService } from '../zero-pool.service';
import { HttpClientModule } from '@angular/common/http';
import { InputAmountModule } from '../common/input-amount/input-amount.module';


@NgModule({
  declarations: [
    MainComponent,
    DepositComponent,
    TransferComponent,
    WithdrawComponent
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
    MatIconModule,
    ReactiveFormsModule,

    HttpClientModule,
    InputAmountModule
  ],
  providers: [
    RelayerApiService
  ]
})
export class MainModule {
}
