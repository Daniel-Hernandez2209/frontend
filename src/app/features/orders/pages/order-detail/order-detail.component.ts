import { Component, OnInit, signal } from '@angular/core';
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
  order = signal<any>(null);
  isLoading = signal(true);
  error = signal<string | null>(null);
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
    if (!id) {
      this.isLoading.set(false);
      this.error.set('ID de orden no encontrado');
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);

    try {
      const order = await this.orderService.getById(id);
      if (order) {
        this.order.set(order);
      } else {
        this.error.set('Orden no encontrada');
      }
    } catch (err: any) {
      this.error.set(err.message || 'Error al cargar la orden');
    } finally {
      this.isLoading.set(false);
    }
  }

  async updateStatus(newStatus: string): Promise<void> {
    const o = this.order();
    if (!o || newStatus === o.status) return;
    if (!confirm(`¿Cambiar estado a "${newStatus}"?`)) return;
    try {
      await this.orderService.updateStatus(o._id, newStatus);
      this.order.update(ord => ({ ...ord, status: newStatus }));
    } catch (err: any) {
      this.error.set(err.message);
    }
  }

  async submitNote(): Promise<void> {
    if (this.noteForm.invalid) return;
    this.submittingNote = true;
    try {
      const updatedOrder = await this.orderService.addNote(
        this.order()._id,
        this.noteForm.get('note')?.value
      );
      if (updatedOrder) this.order.set(updatedOrder);
      this.noteForm.reset();
      this.showNoteForm = false;
    } catch (err: any) {
      this.error.set(err.message);
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
    const o = this.order();
    if (!o) return 0;
    return this.orderService.getOrderTotal(o);
  }

  getSubtotal(): number {
    const o = this.order();
    if (!o) return 0;
    return Number(o.pricing?.subtotal ?? o.subtotal ?? 0);
  }

  getTax(): number {
    const o = this.order();
    if (!o) return 0;
    return Number(o.pricing?.tax ?? o.tax ?? 0);
  }

  getShipping(): number {
    const o = this.order();
    if (!o) return 0;
    return Number(o.pricing?.shipping ?? o.shippingCost ?? 0);
  }

  getItemPrice(item: any): number {
    return Number(item.unitPrice ?? item.price ?? 0);
  }

  getItemSubtotal(item: any): number {
    return Number(item.subtotal ?? (this.getItemPrice(item) * (item.quantity || 1)));
  }

  getCustomerName(): string {
    return this.orderService.getCustomerName(this.order());
  }

  getCustomerEmail(): string {
    return this.orderService.getCustomerEmail(this.order());
  }
}
