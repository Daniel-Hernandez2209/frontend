import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './user-form.component.html'
})
export class UserFormComponent implements OnInit {

  userForm!: FormGroup;
  isEditMode    = false;
  userId: string | null = null;
  isSubmitting  = signal(false);
  isLoadingUser = signal(false);
  formError     = signal<string | null>(null);
  formSuccess   = signal<string | null>(null);
  showPassword  = signal(false);
  showConfirm   = signal(false);

  roleOptions = [
    { value: 'user',  label: 'Usuario — acceso básico' },
    { value: 'admin', label: 'Administrador — acceso total' }
  ];

  get isLoading() { return this.userService.isLoading; }

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this._buildForm();
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.isEditMode = true;
        this.userId = id;
        this._setEditValidators();
        this._loadUser(id);
      } else {
        this._setCreateValidators();
      }
    });
  }

  // ── Construcción del formulario ───────────────────────────────────────
  private _buildForm(): void {
    this.userForm = this.fb.group({
      firstName:       ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      lastName:        ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      email:           ['', [Validators.required, Validators.email]],
      phone:           ['', [Validators.pattern(/^[+\d\s()\-]{7,20}$/)]],
      address:         [''],
      role:            ['user', Validators.required],
      isActive:        [true],
      isVerified:      [false],
      password:        [''],
      confirmPassword: ['']
    }, { validators: this._passwordMatchValidator });
  }

  private _setCreateValidators(): void {
    this.userForm.get('password')?.setValidators([
      Validators.required,
      Validators.minLength(8),
      Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    ]);
    this.userForm.get('confirmPassword')?.setValidators([Validators.required]);
    this.userForm.get('password')?.updateValueAndValidity();
    this.userForm.get('confirmPassword')?.updateValueAndValidity();
  }

  private _setEditValidators(): void {
    // En edición la contraseña es opcional (sólo si quiere cambiarla)
    this.userForm.get('password')?.setValidators([
      Validators.minLength(8),
      Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    ]);
    this.userForm.get('password')?.updateValueAndValidity();
    this.userForm.get('confirmPassword')?.clearValidators();
    this.userForm.get('confirmPassword')?.updateValueAndValidity();
  }

  private _passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
    const pwd  = group.get('password')?.value;
    const conf = group.get('confirmPassword')?.value;
    if (pwd && conf && pwd !== conf) {
      return { passwordMismatch: true };
    }
    return null;
  }

  // ── Cargar usuario en modo edición ────────────────────────────────────
  private async _loadUser(id: string): Promise<void> {
    this.isLoadingUser.set(true);
    try {
      const user = await this.userService.getById(id);
      if (user) {
        this.userForm.patchValue({
          firstName:  user.firstName,
          lastName:   user.lastName,
          email:      user.email,
          phone:      user.phone   ?? '',
          address:    user.address ?? '',
          role:       user.role,
          isActive:   user.isActive,
          isVerified: user.isVerified
        });
      } else {
        this.formError.set('Usuario no encontrado');
      }
    } catch {
      this.formError.set('Error al cargar el usuario');
    } finally {
      this.isLoadingUser.set(false);
    }
  }

  // ── Submit ────────────────────────────────────────────────────────────
  async onSubmit(): Promise<void> {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      this.formError.set('Por favor, corrige los errores indicados');
      return;
    }

    this.isSubmitting.set(true);
    this.formError.set(null);
    const v = this.userForm.value;

    try {
      if (this.isEditMode && this.userId) {
        const payload: any = {
          firstName:  v.firstName,
          lastName:   v.lastName,
          email:      v.email,
          phone:      v.phone   || undefined,
          address:    v.address || undefined,
          role:       v.role,
          isActive:   v.isActive,
          isVerified: v.isVerified
        };
        if (v.password) payload.password = v.password;

        await this.userService.update(this.userId, payload);
        this.formSuccess.set('Usuario actualizado correctamente');
      } else {
        await this.userService.create({
          firstName: v.firstName,
          lastName:  v.lastName,
          email:     v.email,
          password:  v.password,
          phone:     v.phone   || undefined,
          address:   v.address || undefined,
          role:      v.role,
          isActive:  v.isActive
        });
        this.formSuccess.set('Usuario creado correctamente');
      }

      setTimeout(() => this.router.navigate(['/admin/users']), 1400);
    } catch (err: any) {
      this.formError.set(err.message ?? 'Error al guardar el usuario');
    } finally {
      this.isSubmitting.set(false);
    }
  }

  goBack(): void { this.router.navigate(['/admin/users']); }

  // ── Helpers ───────────────────────────────────────────────────────────
  toggleShowPassword(): void { this.showPassword.update(v => !v); }
  toggleShowConfirm(): void  { this.showConfirm.update(v => !v); }

  isFieldInvalid(field: string): boolean {
    const ctrl = this.userForm.get(field);
    return !!(ctrl?.invalid && (ctrl.dirty || ctrl.touched));
  }

  getFieldError(field: string): string {
    const ctrl = this.userForm.get(field);
    if (!ctrl?.errors) return '';
    if (ctrl.errors['required'])    return 'Este campo es obligatorio';
    if (ctrl.errors['email'])       return 'Introduce un email válido';
    if (ctrl.errors['minlength'])   return `Mínimo ${ctrl.errors['minlength'].requiredLength} caracteres`;
    if (ctrl.errors['maxlength'])   return `Máximo ${ctrl.errors['maxlength'].requiredLength} caracteres`;
    if (ctrl.errors['pattern']) {
      if (field === 'phone')    return 'Formato de teléfono no válido';
      if (field === 'password') return 'Debe incluir mayúsculas, minúsculas y números';
    }
    return 'Campo inválido';
  }

  get passwordMismatch(): boolean {
    return !!(this.userForm.errors?.['passwordMismatch'] &&
              this.userForm.get('confirmPassword')?.touched);
  }

  get hasPasswordValue(): boolean {
    return !!(this.userForm.get('password')?.value);
  }
}
