import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        }
      },
      animation: {
        gradient: 'gradient 8s ease infinite',
      },
      colors: {
        primary: {
          DEFAULT: '#0066FF',
          hover: '#0052CC',
          light: '#E6F0FF',
          subtle: '#F0F7FF',
        },
        dark: {
          DEFAULT: '#0F172A',
          secondary: '#1E293B',
          muted: '#64748B',
        },
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
    },
  },
  plugins: [],
}
export default config
