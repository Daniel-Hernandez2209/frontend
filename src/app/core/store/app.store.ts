// src/app/core/store/app.store.ts
import {
  signalStore,
  withState,
  withMethods,
  withComputed,
  patchState,
  computed,
} from '@ngrx/signals';
import { User } from '../services/auth.service';

// ==================== ESTADO ====================
interface AppState {
  isLoading: boolean;
  currentUser: User | null;
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
  notifications: any[];
}

const initialState: AppState = {
  isLoading: false,
  currentUser: null,
  theme: 'light',
  sidebarOpen: true,
  notifications: [],
};

// ==================== STORE ====================
export const AppStore = signalStore(
  { providedIn: 'root' },

  // Estado base
  withState(initialState),

  // Métodos para modificar estado
  withMethods((store) => ({
    setLoading(loading: boolean): void {
      patchState(store, { isLoading: loading });
    },

    setCurrentUser(user: User | null): void {
      patchState(store, { currentUser: user });
    },

    setTheme(theme: 'light' | 'dark'): void {
      patchState(store, { theme });
    },

    toggleSidebar(): void {
      patchState(store, {
        sidebarOpen: !store.sidebarOpen(),
      });
    },

    openSidebar(): void {
      patchState(store, { sidebarOpen: true });
    },

    closeSidebar(): void {
      patchState(store, { sidebarOpen: false });
    },

    addNotification(notification: any): void {
      patchState(store, {
        notifications: [...store.notifications(), notification],
      });
    },

    removeNotification(id: string): void {
      patchState(store, {
        notifications: store.notifications().filter((n: any) => n.id !== id),
      });
    },

    clearNotifications(): void {
      patchState(store, { notifications: [] });
    },
  })),

  // Valores computados
  withComputed((store) => ({
    isAuthenticated: computed(() => !!store.currentUser()),
    userRole: computed(() => store.currentUser()?.role ?? 'guest'),
    isAdmin: computed(() => store.currentUser()?.role === 'admin'),
    notificationCount: computed(() => store.notifications().length),
    isDarkMode: computed(() => store.theme() === 'dark'),
  })),
);
