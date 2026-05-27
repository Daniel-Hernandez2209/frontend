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
    <div class="flex flex-col h-screen bg-gray-100">
      <!-- Navbar -->
      <app-navbar></app-navbar>

      <!-- Main Content -->
      <div class="flex flex-1 overflow-hidden">
        <!-- Sidebar -->
        <app-sidebar></app-sidebar>

        <!-- Page Content -->
        <main class="flex-1 overflow-y-auto">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [],
})
export class AdminLayoutComponent {}
