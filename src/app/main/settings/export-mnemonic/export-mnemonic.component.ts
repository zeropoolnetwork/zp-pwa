import { Component } from '@angular/core';
import { AccountService, IAccount } from '../../../services/account.service';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-export-mnemonic',
  templateUrl: './export-mnemonic.component.html',
  styleUrls: ['./export-mnemonic.component.scss']
})
export class ExportMnemonicComponent {

  public mnemonic = this.accountService.account$.pipe(
    map((account: IAccount) => {
      return account.zeropoolMnemonic;
    })
  );

  constructor(private accountService: AccountService) {
  }

  showMnemonic() {

  }

}
