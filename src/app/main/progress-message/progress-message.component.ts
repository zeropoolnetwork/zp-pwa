import { Component, OnInit } from '@angular/core';
import { ActionList, resolveProgressMessage, StepList } from './transaction-progress';

@Component({
  selector: 'app-progress-message',
  templateUrl: './progress-message.component.html',
  styleUrls: ['./progress-message.component.scss']
})
export class ProgressMessageComponent implements OnInit {

  imageSrc = '/assets/images/guy-fawkes-cross-fingers.png';
  title: string;
  progressMessageLineOne: string;
  progressMessageLineTwo: string;
  // isLineTwoBold: boolean;
  color = 'rgba(100, 100, 100, 0.5)';
  href;

  constructor() {
  }

  ngOnInit(): void {
  }

  showMessage(action: ActionList, step: StepList, link?: string) {
    const messages = resolveProgressMessage(action, step);

    this.title = messages.title || '';
    this.progressMessageLineOne = messages.lineOne || '';
    this.progressMessageLineTwo = messages.lineTwo || '';
    this.imageSrc = messages.image ? messages.image : this.imageSrc;

    this.href = link;
  }

}
