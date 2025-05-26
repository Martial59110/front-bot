import { Component } from '@angular/core';
import { CardComponent } from '../card/card.component';
import { GaugeComponent } from '../gauge/gauge.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CardComponent, GaugeComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {}
