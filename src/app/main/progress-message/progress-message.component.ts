import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-progress-message',
  templateUrl: './progress-message.component.html',
  styleUrls: ['./progress-message.component.scss']
})
export class ProgressMessageComponent implements OnInit {

  imageSrc = '/assets/images/guy-fawkes-cross-fingers.png';
  progressMessageLineOne: string;
  isLineTwoBold: boolean;
  color = 'rgba(100, 100, 100, 0.5)';

  progressMessageLineTwo: string;

  constructor() {
  }

  ngOnInit(): void {
  }

  showMessage() {
    console.log('1')
    debugger
  }

  showErrorMessage() {
    console.log('2')
  }

}
