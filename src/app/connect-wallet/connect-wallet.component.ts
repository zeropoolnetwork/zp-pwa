import { Component, OnInit } from '@angular/core';
import { Web3ProviderService } from '../services/web3.provider.service';
import { take } from 'rxjs/operators';
import { Router } from '@angular/router';

@Component({
  selector: 'app-connect-wallet',
  templateUrl: './connect-wallet.component.html',
  styleUrls: ['./connect-wallet.component.scss']
})
export class ConnectWalletComponent implements OnInit {

  constructor(private router: Router, private web3Service: Web3ProviderService) {
    this.web3Service.isReady$.pipe(
      take(1)
    ).subscribe(
      () => {
        this.router.navigate(['/main']);
      }
    );
  }

  ngOnInit(): void {
  }

  connectWallet() {
    this.web3Service.connectWeb3();
  }
}
