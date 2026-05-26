import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ProductService } from '../../services/product.service';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './product-form.component.html',
  styleUrls: [],
})
export class ProductFormComponent implements OnInit, OnDestroy {
  form: FormGroup;
  sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

  uploadError = signal('');
  isSubmitting = signal(false);
  formError = signal<string | null>(null);
  imagePreviews: string[] = [];
  imagesToUpload: File[] = [];
  selectedSizes: Map<string, number> = new Map();

  get isEditMode() {
    return !!this.route.snapshot.paramMap.get('id');
  }

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private route: ActivatedRoute,
    private router: Router,
  ) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      slug: [''],
      description: [
        '',
        [Validators.required, Validators.minLength(10), Validators.maxLength(2000)],
      ],
      price: [0, [Validators.required, Validators.min(0.01)]],
      discountPrice: [null],
      category: ['', Validators.required],
      subcategory: [''],
      sku: ['', Validators.required],
      material: [''],
      careInstructions: [''],
      metaTitle: [''],
      metaDescription: [''],
      isActive: [true],
      isFeatured: [false],
      tags: [''],
    });
  }

  ngOnInit(): void {
    if (this.isEditMode) {
      this.loadProduct();
    }
  }

  ngOnDestroy(): void {
    // Cleanup previews
    this.imagePreviews.forEach((url) => URL.revokeObjectURL(url));
  }

  async loadProduct(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id')!;
    const product = await this.productService.getBySlug(id);

    if (product) {
      this.form.patchValue({
        name: product.name,
        description: product.description,
        price: product.price,
        discountPrice: product.discountPrice || null,
        category: product.category,
        subcategory: product.subcategory || '',
        sku: product.sku,
        material: product.material || '',
        careInstructions: product.careInstructions || '',
        metaTitle: product.metaTitle || '',
        metaDescription: product.metaDescription || '',
        isActive: product.isActive,
        isFeatured: product.isFeatured,
        tags: product.tags?.join(', ') || '',
      });

      // Load existing images as previews
      if (product.images && product.images.length > 0) {
        this.imagePreviews = product.images.map((img: any) => img.url);
      }

      // Load existing sizes
      if (product.sizes) {
        product.sizes.forEach((size: any) => {
          this.selectedSizes.set(size.size, size.stock);
        });
      }
    }
  }

  onFileSelected(event: Event): void {
    const files = (event.target as HTMLInputElement).files;
    if (files) {
      this.addFiles(Array.from(files));
    }
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    const files = event.dataTransfer?.files;
    if (files) {
      this.addFiles(Array.from(files));
    }
  }

  private addFiles(files: File[]): void {
    this.uploadError.set('');

    files.forEach((file) => {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        this.uploadError.set('File size exceeds 10 MB limit');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        this.uploadError.set('Only image files are allowed');
        return;
      }

      this.imagesToUpload.push(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        this.imagePreviews.push(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    });
  }

  removeImage(index: number): void {
    URL.revokeObjectURL(this.imagePreviews[index]);
    this.imagePreviews.splice(index, 1);
    if (index < this.imagesToUpload.length) {
      this.imagesToUpload.splice(index, 1);
    }
  }

  onSizeChange(event: Event, size: string): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked && !this.selectedSizes.has(size)) {
      this.selectedSizes.set(size, 0);
    } else if (!checked) {
      this.selectedSizes.delete(size);
    }
  }

  isSizeSelected(size: string): boolean {
    return this.selectedSizes.has(size);
  }

  getSizeStock(size: string): number {
    return this.selectedSizes.get(size) || 0;
  }

  onStockChange(event: Event, size: string): void {
    const stock = parseInt((event.target as HTMLInputElement).value, 10) || 0;
    this.selectedSizes.set(size, stock);
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.form.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.formError.set('Please fill all required fields correctly');
      return;
    }

    this.isSubmitting.set(true);
    this.formError.set(null);

    try {
      // Upload images if any
      let imageUrls: string[] = [];
      if (this.imagesToUpload.length > 0) {
        imageUrls = await this.productService.uploadImages(this.imagesToUpload);
      }

      // Prepare product data
      const formValue = this.form.value;
      const productData: any = {
        ...formValue,
        sizes: Array.from(this.selectedSizes.entries()).map(([size, stock]) => ({
          size,
          stock,
        })),
        tags: formValue.tags?.split(',').map((t: string) => t.trim()) || [],
        images: imageUrls.map((url, i) => ({
          url,
          alt: formValue.name,
          isPrimary: i === 0,
        })),
      };

      if (this.isEditMode) {
        const id = this.route.snapshot.paramMap.get('id')!;
        await this.productService.update(id, productData);
      } else {
        await this.productService.create(productData);
      }

      // Navigate back to list
      this.router.navigate(['/admin/products']);
    } catch (error: any) {
      this.formError.set(error.message || 'Error saving product');
      console.error('Submit error:', error);
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
