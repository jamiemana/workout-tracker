import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#0A0A0A',
          secondary: '#111111',
          tertiary: '#141414',
          input: '#1E1E1E',
        },
        text: {
          primary: '#FFFFFF',
          secondary: '#888888',
          tertiary: '#666666',
          muted: '#444444',
        },
        border: {
          default: '#1A1A1A',
          subtle: '#2A2A2A',
        },
        accent: {
          lime: '#ADFF02',
          'lime-bg': '#0D1A00',
          'lime-border': '#2A3D00',
          'lime-muted': '#5A8501',
          cyan: '#2FE8EB',
          coral: '#FC7753',
          violet: '#8F00FF',
          'violet-bg': '#0F0019',
          'violet-border': '#2A0047',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['SF Mono', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
} satisfies Config
