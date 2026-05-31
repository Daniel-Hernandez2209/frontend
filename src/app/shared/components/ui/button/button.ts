import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'ghost' | 'outline' | 'error';
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      [class]="getButtonClasses()"
      [disabled]="disabled"
      (click)="onClick($event)"
      [type]="type"
    >
      <ng-content></ng-content>
    </button>
  `,
  styles: [],
})
export class ButtonComponent {
  @Input() variant: ButtonVariant = 'primary';
  @Input() size: ButtonSize = 'md';
  @Input() disabled = false;
  @Input() loading = false;
  @Input() type: 'button' | 'submit' | 'reset' = 'button';

  getButtonClasses(): string {
    const baseClasses = 'btn font-semibold transition-all';

    const variantClasses = {
      primary: 'btn-primary',
      secondary: 'btn-secondary',
      accent: 'btn-accent',
      ghost: 'btn-ghost',
      outline: 'btn-outline',
      error: 'btn-error',
    };

    const sizeClasses = {
      xs: 'btn-xs',
      sm: 'btn-sm',
      md: '',
      lg: 'btn-lg',
    };

    const classes = [
      baseClasses,
      variantClasses[this.variant],
      sizeClasses[this.size],
      this.disabled ? 'btn-disabled' : '',
      this.loading ? 'loading' : '',
    ];

    return classes.filter(Boolean).join(' ');
  }

  onClick(event: MouseEvent) {
    if (this.disabled || this.loading) {
      event.preventDefault();
    }
  }
}
