import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent, SidebarComponent],
  template: `
    <div class="flex h-screen overflow-hidden bg-base-200" data-theme="dark">
      <!-- Sidebar -->
      <app-sidebar></app-sidebar>

      <!-- Right side: navbar + content -->
      <div class="flex flex-col flex-1 overflow-hidden">
        <app-navbar></app-navbar>
        <main class="flex-1 overflow-y-auto">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [],
})
export class AdminLayoutComponent {}
