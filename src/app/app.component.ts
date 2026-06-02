import { inject } from '@angular/core';
import { ToastComponent } from '@shared/components/toast/toast.component';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, ToastComponent], // ← Agregar
  template: `
    <app-toast />
    <!-- ← Agregar -->

    <!-- resto del template -->
    @if (auth.isAuthenticated()) {
      <!-- navbar -->
    }
    <main>
      <router-outlet />
    </main>
  `,
})
export class AppComponent {
  auth = inject(AuthService);

  onLogout() {
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
      this.auth.logout();
    }
  }
}
