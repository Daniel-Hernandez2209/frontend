import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        athena: {
          primary: '#3b82f6', // Azul
          secondary: '#8b5cf6', // Púrpura
          accent: '#ec4899', // Rosa
          success: '#10b981', // Verde
          warning: '#f59e0b', // Ámbar
          error: '#ef4444', // Rojo
        },
      },
    },
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: [
      {
        light: {
          primary: '#3b82f6',
          secondary: '#8b5cf6',
          accent: '#ec4899',
          neutral: '#1f2937',
          'base-100': '#ffffff',
          'base-200': '#f3f4f6',
          'base-300': '#d1d5db',
          info: '#0ea5e9',
          success: '#10b981',
          warning: '#f59e0b',
          error: '#ef4444',
        },
      },
      {
        dark: {
          primary: '#60a5fa',
          secondary: '#a78bfa',
          accent: '#f472b6',
          neutral: '#111827',
          'base-100': '#1f2937',
          'base-200': '#111827',
          'base-300': '#374151',
          info: '#06b6d4',
          success: '#34d399',
          warning: '#fbbf24',
          error: '#f87171',
        },
      },
    ],
    darkTheme: 'dark',
    base: true,
    styled: true,
    utils: true,
    prefix: '',
  },
};

export default config;
