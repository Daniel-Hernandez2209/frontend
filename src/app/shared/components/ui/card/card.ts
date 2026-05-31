import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="card bg-base-100 shadow-md border border-base-300 hover:shadow-lg transition-shadow"
    >
      <div class="card-body p-6">
        <h2 class="card-title" *ngIf="title">{{ title }}</h2>
        <ng-content></ng-content>
      </div>
      <div class="card-actions justify-end p-6" *ngIf="showActions">
        <ng-content select="[card-actions]"></ng-content>
      </div>
    </div>
  `,
  styles: [],
})
export class CardComponent {
  @Input() title: string = '';
  @Input() showActions = false;
}
