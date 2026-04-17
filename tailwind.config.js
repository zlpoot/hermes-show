/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./app/components/**/*.{js,vue,ts}",
    "./app/layouts/**/*.vue",
    "./app/pages/**/*.vue",
    "./app/plugins/**/*.{js,ts}",
    "./app/app.vue",
    "./app/error.vue"
  ],
  theme: {
    extend: {
      colors: {
        background: '#09090b',
        foreground: '#fafafa',
        primary: {
          DEFAULT: '#10b981', // Emerald 500
          foreground: '#ffffff',
          hover: '#059669', // Emerald 600
        },
        secondary: {
          DEFAULT: '#3b82f6', // Blue 500
          foreground: '#ffffff',
        },
        muted: {
          DEFAULT: '#27272a', // Zinc 800
          foreground: '#a1a1aa', // Zinc 400
        },
        card: {
          DEFAULT: 'rgba(24, 24, 27, 0.6)', // Zinc 900 with opacity
          foreground: '#fafafa',
          border: 'rgba(63, 63, 70, 0.4)', // Zinc 700 with opacity
        }
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'ui-monospace', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
