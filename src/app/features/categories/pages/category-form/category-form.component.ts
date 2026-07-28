import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CategoryService } from '../../services/category.service';
import { firstValueFrom, from, Subject, takeUntil } from 'rxjs';

export interface CategoryFormData {
  name: string;
  slug: string;
  description: string;
  icon: string;
  isActive: boolean;
  image?: string;
}

@Component({
  selector: 'app-category-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterModule],
  templateUrl: './category-form.component.html',
  // styleUrls: ['./category-form.component.css'],
})
export class CategoryFormComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private categoryService = inject(CategoryService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroy$ = new Subject<void>();

  // ── Estado (Signals) ────────────────────────────────────────────
  isSubmitting = signal(false);
  isEditMode = signal(false);
  isLoadingCategory = signal(false);
  categoryId = signal<string | null>(null); // holds slug in edit mode
  imagePreview = signal<string | null>(null);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  // ── Computed ────────────────────────────────────────────────────
  pageTitle = computed(() => (this.isEditMode() ? 'Edit Category' : 'Create Category'));
  submitLabel = computed(() => (this.isEditMode() ? 'Update Category' : 'Create Category'));
  isFormDisabled = computed(() => this.isSubmitting() || this.isLoadingCategory());

  // ── Formulario Reactivo ─────────────────────────────────────────
  categoryForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
    slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]],
    description: ['', [Validators.maxLength(500)]],
    icon: [''],
    isActive: [true],
  });

  // ── Contadores de caracteres ────────────────────────────────────
  nameCharCount = signal(0);
  descCharCount = signal(0);
  slugTouched = signal(false);

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.isEditMode.set(true);
        this.categoryId.set(id);
        this.loadCategory(id);
      }
    });

    this.categoryForm.controls.name.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((v) => this.nameCharCount.set(v?.length ?? 0));

    this.categoryForm.controls.description.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((v) => this.descCharCount.set(v?.length ?? 0));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── MÉTODOS PÚBLICOS ────────────────────────────────────────────

  async loadCategory(id: string): Promise<void> {
    this.isLoadingCategory.set(true);
    this.errorMessage.set(null);
    try {
      // ✅ Maneja tanto Promise como Observable
      const category = (await this.toPromise(this.categoryService.getById(id))) as CategoryFormData;

      if (category) {
        this.categoryForm.patchValue({
          name: category.name,
          slug: category.slug,
          description: category.description ?? '',
          icon: category.icon ?? '',
          isActive: category.isActive,
        });
        this.slugTouched.set(true);
        if (category.image) {
          this.imagePreview.set(category.image);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cargar la categoría';
      this.errorMessage.set(msg);
    } finally {
      this.isLoadingCategory.set(false);
    }
  }

  onNameChange(): void {
    const name = this.categoryForm.controls.name.value;
    if (name && !this.slugTouched()) {
      this.categoryForm.controls.slug.setValue(this.generateSlug(name));
    }
  }

  onSlugManualEdit(): void {
    this.slugTouched.set(true);
  }

  regenerateSlug(): void {
    const name = this.categoryForm.controls.name.value;
    if (name) {
      this.categoryForm.controls.slug.setValue(this.generateSlug(name));
      this.slugTouched.set(false);
    }
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.errorMessage.set('Please select a valid image file (JPG, PNG, GIF, WebP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.errorMessage.set('Image must be less than 5MB');
      return;
    }

    this.errorMessage.set(null);
    const reader = new FileReader();
    reader.onload = (e) => this.imagePreview.set(e.target?.result as string);
    reader.onerror = () => this.errorMessage.set('Failed to read the image file');
    reader.readAsDataURL(file);
  }

  removeImage(): void {
    this.imagePreview.set(null);
    this.categoryForm.controls.icon.setValue('');
  }

  async onSubmit(): Promise<void> {
    this.categoryForm.markAllAsTouched();

    if (this.categoryForm.invalid) {
      this.errorMessage.set('Please fill in all required fields correctly');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    try {
      const formValue: CategoryFormData = this.categoryForm.getRawValue();

      if (this.isEditMode() && this.categoryId()) {
        // ✅ Maneja tanto Promise como Observable
        await this.toPromise(this.categoryService.update(this.categoryId()!, formValue));
        this.successMessage.set('Category updated successfully!');
      } else {
        // ✅ Maneja tanto Promise como Observable
        await this.toPromise(this.categoryService.create(formValue));
        this.successMessage.set('Category created successfully!');
      }

      setTimeout(() => this.router.navigate(['/admin/categories']), 1000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error saving category';
      this.errorMessage.set(msg);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  goBack(): void {
    this.router.navigate(['/admin/categories']);
  }

  dismissMessage(): void {
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }

  // ── HELPERS ─────────────────────────────────────────────────────

  /**
   * Convertir Promise o Observable a Promise
   * Funciona con ambos tipos de métodos del servicio
   */
  private async toPromise<T>(value: Promise<T> | any): Promise<T> {
    // Si es Promise, retorna directamente
    if (value instanceof Promise) {
      return value;
    }
    // Si es Observable, convertir con firstValueFrom
    return firstValueFrom(value);
  }

  private generateSlug(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  hasError(field: string): boolean {
    const control = this.categoryForm.get(field);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  getErrorMessage(field: string): string {
    const control = this.categoryForm.get(field);
    if (!control?.errors) return '';
    if (control.errors['required']) return 'This field is required';
    if (control.errors['minlength'])
      return `Minimum ${control.errors['minlength'].requiredLength} characters`;
    if (control.errors['maxlength'])
      return `Maximum ${control.errors['maxlength'].requiredLength} characters`;
    if (control.errors['pattern']) return 'Only lowercase letters, numbers and hyphens allowed';
    return 'Invalid value';
  }
}
