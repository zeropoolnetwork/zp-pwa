import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, Subject } from 'rxjs';
import { fromPromise } from 'rxjs/internal-compatibility';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class CircomLoaderService {

  proverKey: ArrayBuffer;
  circomeTxJson: any;
  isReady$: Observable<boolean>;

  // tslint:disable-next-line:variable-name
  private _hasError$ = new Subject<boolean>();
  hasError$: Observable<boolean> = this._hasError$.asObservable();

  constructor() {

    const p1$ = fetch('./assets/transaction_pk.bin')
      .then( (proverKeyBin: Response) => {
        return proverKeyBin.arrayBuffer();
      })
      .then( (pk) => {
        this.proverKey = pk;
      });

    const p2$ = fetch('./assets/transaction.json')
      .then((transactionJson: Response) => {
        return transactionJson.json();
      })
      .then( (txJson: any) => {
        this.circomeTxJson = txJson;
      });

    this.isReady$ = fromPromise(Promise.all([p1$, p2$]))
      .pipe(
        catchError((err) => {
          console.error('Can\'t load on of circome files');
          console.error(err);
          this._hasError$.next(true);
          return of(false);
        }),
        map( () => true)
      );
  }
}
