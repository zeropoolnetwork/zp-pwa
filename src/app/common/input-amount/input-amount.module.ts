import { NgModule } from '@angular/core';
import { InputAmountComponent } from './input-amount.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';

@NgModule({
  declarations: [
    InputAmountComponent,
  ],
  imports: [
    MatFormFieldModule,
    ReactiveFormsModule,
    MatInputModule,
    FormsModule
  ],
  providers: [],
  exports: [InputAmountComponent]
})
export class InputAmountModule {
}
