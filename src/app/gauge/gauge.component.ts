import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-gauge',
  imports: [],
  templateUrl: './gauge.component.html',
  styleUrl: './gauge.component.scss'
})
export class GaugeComponent {
  @Input() value: number = 0;
  @Input() max: number = 100;
}
