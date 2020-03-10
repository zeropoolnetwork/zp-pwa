import { Component, OnInit } from '@angular/core';

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
  isLineTwoBold: boolean;
  color = 'rgba(100, 100, 100, 0.5)';

  constructor() {
  }

  ngOnInit(): void {
  }

  showMessage(messages) {
    this.title = messages.title || '';
    this.progressMessageLineOne = messages.lineOne || '';
    this.progressMessageLineTwo = messages.lineTwo || '';
    this.isLineTwoBold = !!messages.isLineTwoBold;
    this.imageSrc = messages.image ? messages.image : this.imageSrc;
  }

  showErrorMessage() {
    // console.log('2');
  }

}
