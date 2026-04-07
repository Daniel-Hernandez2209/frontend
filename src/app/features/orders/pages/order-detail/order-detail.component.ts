import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { OrderService } from '../../services/order.service';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule],
  templateUrl: './order-detail.component.html',
  styleUrls: []
})
export class OrderDetailComponent implements OnInit {
  order: any = null;
  isLoading = true;
  error: string | null = null;
  noteForm: FormGroup;
  showNoteForm = false;
  submittingNote = false;

  statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'processing', label: 'Processing' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  constructor(
    private orderService: OrderService,
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.noteForm = this.fb.group({
      note: ['', [Validators.required, Validators.minLength(5)]]
    });
  }

  ngOnInit(): void {
    this.loadOrder();
  }

  async loadOrder(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    try {
      this.isLoading = true;
      const order = await this.orderService.getById(id);
      if (order) {
        this.order = order;
      } else {
        this.error = 'Order not found';
      }
    } catch (err: any) {
      this.error = err.message || 'Failed to load order';
    } finally {
      this.isLoading = false;
    }
  }

  async updateStatus(newStatus: string): Promise<void> {
    if (!this.order || newStatus === this.order.status) return;

    if (!confirm(`Update order status to "${newStatus}"?`)) return;

    try {
      await this.orderService.updateStatus(this.order._id, newStatus);
      this.order.status = newStatus;
    } catch (err: any) {
      this.error = err.message;
    }
  }

  async submitNote(): Promise<void> {
    if (this.noteForm.invalid) return;

    this.submittingNote = true;
    try {
      const updatedOrder = await this.orderService.addNote(
        this.order._id,
        this.noteForm.get('note')?.value
      );
      this.order = updatedOrder;
      this.noteForm.reset();
      this.showNoteForm = false;
    } catch (err: any) {
      this.error = err.message;
    } finally {
      this.submittingNote = false;
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  formatDate(date: string | Date): string {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  }

  getStatusColor(status: string): string {
    return this.orderService.getStatusColor(status);
  }

  getStatusLabel(status: string): string {
    return this.orderService.getStatusLabel(status);
  }

  getOrderTotal(): number {
    if (!this.order) return 0;
    return this.order.total || this.order.items.reduce((sum: number, item: any) => 
      sum + (item.price * item.quantity), 0);
  }

  getSubtotal(): number {
    if (!this.order) return 0;
    return this.order.items.reduce((sum: number, item: any) => 
      sum + (item.price * item.quantity), 0);
  }
}
