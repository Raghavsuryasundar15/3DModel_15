/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        // Flat white surfaces only — no dark panels, no gradients
        surface: {
          50:  '#ffffff',
          100: '#fafafa',
          600: '#f0f0f0',
          700: '#f5f5f5',
          800: '#ffffff',
          900: '#ffffff',
        },
        // Neutral black/gray "accent" — no purple glow, no shine
        accent: {
          400: '#000000',
          500: '#000000',
          600: '#000000',
        }
      },
      animation: {
        'spin-slow': 'spin 2s linear infinite',
      }
    }
  },
  plugins: []
}
