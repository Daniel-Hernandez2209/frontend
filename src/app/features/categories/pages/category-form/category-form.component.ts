import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CategoryService } from '../../services/category.service';

@Component({
  selector: 'app-category-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './category-form.component.html',
  styleUrls: []
})
export class CategoryFormComponent implements OnInit {
  categoryForm: FormGroup;
  isSubmitting = false;
  isEditMode = false;
  categoryId: string | null = null;
  imagePreview: string | null = null;
  isLoadingCategory = false;

  constructor(
    private fb: FormBuilder,
    private categoryService: CategoryService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.categoryForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]],
      description: ['', [Validators.maxLength(500)]],
      icon: [''],
      isActive: [true]
    });
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.isEditMode = true;
        this.categoryId = id;
        this.loadCategory(id);
      }
    });
  }

  async loadCategory(id: string): Promise<void> {
    try {
      this.isLoadingCategory = true;
      const category = await this.categoryService.getById(id);
      
      if (category) {
        this.categoryForm.patchValue({
          name: category.name,
          slug: category.slug,
          description: category.description,
          icon: category.icon,
          isActive: category.isActive
        });

        if (category.image) {
          this.imagePreview = category.image;
        }
      }
    } finally {
      this.isLoadingCategory = false;
    }
  }

  onNameChange(): void {
    const name = this.categoryForm.get('name')?.value;
    if (name && !this.isEditMode) {
      const slug = name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
      this.categoryForm.get('slug')?.setValue(slug);
    }
  }

  async onFileSelected(event: Event): Promise<void> {
    const input = (event.target as HTMLInputElement);
    const file = input.files?.[0];

    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      this.imagePreview = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  removeImage(): void {
    this.imagePreview = null;
    this.categoryForm.get('icon')?.setValue('');
  }

  async onSubmit(): Promise<void> {
    if (this.categoryForm.invalid) {
      alert('Please fill in all required fields correctly');
      return;
    }

    try {
      this.isSubmitting = true;
      const formValue = this.categoryForm.value;

      if (this.isEditMode && this.categoryId) {
        await this.categoryService.update(this.categoryId, formValue);
        alert('Category updated successfully');
      } else {
        await this.categoryService.create(formValue);
        alert('Category created successfully');
      }

      this.router.navigate(['/admin/categories']);
    } catch (error: any) {
      alert(error.message || 'Error saving category');
    } finally {
      this.isSubmitting = false;
    }
  }

  goBack(): void {
    this.router.navigate(['/admin/categories']);
  }
}
