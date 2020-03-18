import { Component, Input } from '@angular/core';
import { timer } from 'rxjs';
import { delay, tap } from 'rxjs/operators';
import { MatTooltip } from '@angular/material/tooltip';
import { Clipboard } from '@angular/cdk/clipboard';

@Component({
  selector: 'app-copy-tooltip',
  templateUrl: './copy-tooltip.component.html',
})
export class CopyTooltipComponent {

  @Input()
  public dataToCopy: any;

  public tooltipMessage = 'Copy to clipboard';

  constructor(private clipboard: Clipboard) {
  }

  onClick(tooltip: MatTooltip) {
    tooltip.hide();
    this.clipboard.copy(this.dataToCopy);

    timer(250).pipe(
      tap(() => {
        this.tooltipMessage = 'Copied!';
        tooltip.show();
      }),
      delay(1000),
      tap(() => {
        tooltip.hide();
      }),
      delay(50),
      tap(() => {
        this.tooltipMessage = 'Copy to clipboard';
      }),
    ).subscribe(() => {
      console.log('!');
    });
  }


}
