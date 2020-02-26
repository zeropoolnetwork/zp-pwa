import { NgModule } from '@angular/core';
import { InputZpAddressComponent } from './input-zp-address.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';

@NgModule({
  declarations: [
    InputZpAddressComponent,
  ],
  imports: [
    MatFormFieldModule,
    ReactiveFormsModule,
    MatInputModule,
    FormsModule
  ],
  providers: [],
  exports: [InputZpAddressComponent]
})
export class InputZpAddressModule {
}
