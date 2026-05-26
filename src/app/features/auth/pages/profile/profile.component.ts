import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './profile.component.html',
})
export class ProfileComponent implements OnInit {
  // ── Tabs ──────────────────────────────────────────────────────────────
  activeTab = signal<'info' | 'password' | 'security'>('info');

  // ── Formularios ───────────────────────────────────────────────────────
  profileForm!: FormGroup;
  passwordForm!: FormGroup;

  // ── Estado ────────────────────────────────────────────────────────────
  isSavingProfile = signal(false);
  isSavingPassword = signal(false);
  profileSuccess = signal<string | null>(null);
  profileError = signal<string | null>(null);
  passwordSuccess = signal<string | null>(null);
  passwordError = signal<string | null>(null);
  showCurrentPwd = signal(false);
  showNewPwd = signal(false);
  showConfirmPwd = signal(false);

  get user() {
    return this.authService.currentUser;
  }
  get userFullName() {
    return this.authService.userFullName;
  }
  get isAdmin() {
    return this.authService.isAdmin;
  }

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this._buildProfileForm();
    this._buildPasswordForm();
    this._patchProfileForm();
  }

  // ── Construcción de forms ─────────────────────────────────────────────
  private _buildProfileForm(): void {
    this.profileForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      phone: ['', [Validators.pattern(/^[+\d\s()\-]{7,20}$/)]],
      address: [''],
    });
  }

  private _buildPasswordForm(): void {
    this.passwordForm = this.fb.group(
      {
        currentPassword: ['', [Validators.required]],
        newPassword: [
          '',
          [
            Validators.required,
            Validators.minLength(8),
            Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
          ],
        ],
        confirmPassword: ['', Validators.required],
      },
      { validators: this._pwdMatchValidator },
    );
  }

  private _pwdMatchValidator(group: AbstractControl): ValidationErrors | null {
    const n = group.get('newPassword')?.value;
    const c = group.get('confirmPassword')?.value;
    return n && c && n !== c ? { passwordMismatch: true } : null;
  }

  private _patchProfileForm(): void {
    const u = this.user();
    if (u) {
      this.profileForm.patchValue({
        firstName: u.name,
        lastName: u.lastName,
        phone: u.phone ?? '',
        address: u.address ?? '',
      });
    }
  }

  // ── Tabs ──────────────────────────────────────────────────────────────
  setTab(tab: 'info' | 'password' | 'security'): void {
    this.activeTab.set(tab);
    this.profileSuccess.set(null);
    this.profileError.set(null);
    this.passwordSuccess.set(null);
    this.passwordError.set(null);
  }

  // ── Guardar perfil ────────────────────────────────────────────────────
  async saveProfile(): Promise<void> {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }
    this.isSavingProfile.set(true);
    this.profileError.set(null);
    try {
      await this.authService.updateProfile(this.profileForm.value);
      this.profileSuccess.set('Perfil actualizado correctamente');
      setTimeout(() => this.profileSuccess.set(null), 3500);
    } catch (err: any) {
      this.profileError.set(err.message ?? 'Error al actualizar el perfil');
    } finally {
      this.isSavingProfile.set(false);
    }
  }

  // ── Cambiar contraseña ────────────────────────────────────────────────
  async savePassword(): Promise<void> {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }
    this.isSavingPassword.set(true);
    this.passwordError.set(null);
    const { currentPassword, newPassword } = this.passwordForm.value;
    try {
      await this.authService.changePassword(currentPassword, newPassword);
      this.passwordSuccess.set('Contraseña actualizada correctamente');
      this.passwordForm.reset();
      setTimeout(() => this.passwordSuccess.set(null), 3500);
    } catch (err: any) {
      this.passwordError.set(err.message ?? 'Error al cambiar la contraseña');
    } finally {
      this.isSavingPassword.set(false);
    }
  }

  // ── Logout ────────────────────────────────────────────────────────────
  logout(): void {
    this.authService.logout();
  }

  // ── Helpers ───────────────────────────────────────────────────────────
  toggleCurrentPwd(): void {
    this.showCurrentPwd.update((v) => !v);
  }
  toggleNewPwd(): void {
    this.showNewPwd.update((v) => !v);
  }
  toggleConfirmPwd(): void {
    this.showConfirmPwd.update((v) => !v);
  }

  isFieldInvalid(form: FormGroup, field: string): boolean {
    const ctrl = form.get(field);
    return !!(ctrl?.invalid && (ctrl.dirty || ctrl.touched));
  }

  getFieldError(form: FormGroup, field: string): string {
    const ctrl = form.get(field);
    if (!ctrl?.errors) return '';
    if (ctrl.errors['required']) return 'Este campo es obligatorio';
    if (ctrl.errors['minlength'])
      return `Mínimo ${ctrl.errors['minlength'].requiredLength} caracteres`;
    if (ctrl.errors['maxlength'])
      return `Máximo ${ctrl.errors['maxlength'].requiredLength} caracteres`;
    if (ctrl.errors['pattern']) {
      if (field === 'phone') return 'Formato de teléfono no válido';
      if (field === 'newPassword') return 'Debe incluir mayúsculas, minúsculas y números';
    }
    return 'Campo inválido';
  }

  get passwordMismatch(): boolean {
    return !!(
      this.passwordForm.errors?.['passwordMismatch'] &&
      this.passwordForm.get('confirmPassword')?.touched
    );
  }

  get newPwdValue(): string {
    return this.passwordForm.get('newPassword')?.value ?? '';
  }

  getInitials(): string {
    const u = this.user();
    if (!u) return '?';
    const firstName = u.name || u.name?.split(' ')[0] || 'U';
    const lastName = u.lastName || u.name?.split(' ')[1] || 'U';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return '—';
    return new Intl.DateTimeFormat('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(date));
  }
}
