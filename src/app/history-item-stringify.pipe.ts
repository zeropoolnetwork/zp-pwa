import { Pipe, PipeTransform } from '@angular/core';
import { HistoryItem, tbn } from 'zeropool-lib';


function fromDecimals(val: number): string {
  return tbn(val).div(1e18).toFixed(8).toString();
}

function getPlusOrMinusPrefix(tx: HistoryItem): '-' | '+' | '' {
  switch (tx.action) {
    case 'deposit':
      return '+';
    case 'withdraw':
      return '-';
    case 'transfer':
      return tx.type === 'in' ? '+' : '-';
  }
  return '';
}

@Pipe({
  name: 'stringifyHistory'
})
export class StringifyHistoryPipe implements PipeTransform {

  // :"MM/dd/yy"
  // tx.action.toUpperCase()
  // {{ tx.action === 'transfer' ? (tx.type === 'in' ? '+' : '-') : '' }}{{ tx.action === 'deposit' ? '+' : ''}}{{ tx.action === 'withdraw' ? '-' : ''}}{{ fromDecimals(tx.amount) }}

  transform(tx: HistoryItem, ...args: string[]): string {

    if (args[0] === 'title') {
      return tx.action.toUpperCase();
    }

    if (args[0] === 'amount') {
      return `${getPlusOrMinusPrefix(tx)}${fromDecimals(tx.amount)}`;
    }
  }
}
