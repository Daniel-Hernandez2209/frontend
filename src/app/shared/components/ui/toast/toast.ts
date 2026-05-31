import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, Toast } from '../../services/notification.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast toast-top toast-end gap-3">
      <div
        class="alert transition-all"
        [class.alert-success]="toast.type === 'success'"
        [class.alert-error]="toast.type === 'error'"
        [class.alert-warning]="toast.type === 'warning'"
        [class.alert-info]="toast.type === 'info'"
        *ngFor="let toast of toasts"
      >
        <span>{{ toast.message }}</span>
      </div>
    </div>
  `,
  styles: [],
})
export class ToastComponent implements OnInit {
  toasts: Toast[] = [];

  constructor(private notificationService: NotificationService) {}

  ngOnInit() {
    this.notificationService.toasts$.subscribe((toasts) => {
      this.toasts = toasts;
    });
  }
}
