import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Mystical Forge Aesthetic - Biome-inspired gradients
        forge: {
          50: '#fef3f2',
          100: '#fde4e1',
          200: '#fbcdc8',
          300: '#f7aaa2',
          400: '#f17b6d',
          500: '#e65140',
          600: '#d33422',
          700: '#b12818',
          800: '#932417',
          900: '#7a241a',
          950: '#430f09',
        },
        neon: {
          blue: '#00d4ff',
          purple: '#b026ff',
          green: '#00ff88',
          gold: '#ffd700',
          red: '#ff0055',
        },
        albion: {
          black: '#0a0a0a',
          gray: {
            900: '#1a1a1a',
            800: '#2a2a2a',
            700: '#3a3a3a',
            600: '#4a4a4a',
            500: '#6a6a6a',
          },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'mystical-forge': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'biome-forest': 'linear-gradient(135deg, #134e4a 0%, #14532d 100%)',
        'biome-desert': 'linear-gradient(135deg, #78350f 0%, #92400e 100%)',
        'biome-snow': 'linear-gradient(135deg, #0c4a6e 0%, #075985 100%)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(0, 212, 255, 0.5)' },
          '100%': { boxShadow: '0 0 20px rgba(0, 212, 255, 1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
