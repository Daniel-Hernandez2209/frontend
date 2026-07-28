import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-shop-layout',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div class="min-h-screen flex flex-col">
      <main class="flex-1">
        <router-outlet />
      </main>
    </div>
  `,
})
export class ShopLayoutComponent {}
