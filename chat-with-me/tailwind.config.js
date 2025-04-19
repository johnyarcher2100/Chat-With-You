/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--apple-blue)', // Apple 藍色
          light: 'var(--apple-teal)',
          dark: '#0062CC', // 深藍色
        },
        secondary: {
          DEFAULT: 'var(--apple-green)', // Apple 綠色
          light: '#4CD964',
          dark: '#248A3D',
        },
        background: {
          DEFAULT: 'var(--background)', // 背景色
          light: 'var(--apple-gray-6)',
          dark: 'var(--apple-gray-5)',
        },
        accent: {
          DEFAULT: 'var(--apple-orange)', // Apple 橙色
          light: '#FFAC33',
          dark: '#CC7700',
        },
        error: {
          DEFAULT: 'var(--apple-red)', // Apple 紅色
          light: '#FF6961',
          dark: '#CC2F26',
        },
        success: 'var(--apple-green)',
        warning: 'var(--apple-yellow)',
        info: 'var(--apple-teal)',
        gray: {
          100: 'var(--apple-gray-6)',
          200: 'var(--apple-gray-5)',
          300: 'var(--apple-gray-4)',
          400: 'var(--apple-gray-3)',
          500: 'var(--apple-gray-2)',
          600: 'var(--apple-gray-1)',
        },
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'San Francisco',
          'Helvetica Neue',
          'ui-sans-serif',
          'system-ui',
          'Arial',
          'sans-serif',
        ],
      },
      boxShadow: {
        'apple-sm': 'var(--apple-shadow-sm)',
        'apple-md': 'var(--apple-shadow-md)',
        'apple-lg': 'var(--apple-shadow-lg)',
        'apple': 'var(--apple-shadow-md)',
      },
      borderRadius: {
        'apple-sm': 'var(--apple-radius-sm)',
        'apple-md': 'var(--apple-radius-md)',
        'apple-lg': 'var(--apple-radius-lg)',
        'apple-xl': 'var(--apple-radius-xl)',
        'apple-full': 'var(--apple-radius-full)',
        'apple': 'var(--apple-radius-md)',
      },
      backdropBlur: {
        'apple-sm': 'var(--apple-blur-sm)',
        'apple-md': 'var(--apple-blur-md)',
        'apple-lg': 'var(--apple-blur-lg)',
      },
      transitionProperty: {
        'apple': 'all',
      },
      transitionTimingFunction: {
        'apple': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      },
      transitionDuration: {
        'apple-fast': 'var(--apple-transition-fast)',
        'apple-medium': 'var(--apple-transition-medium)',
        'apple-slow': 'var(--apple-transition-slow)',
      },
    },
  },
  plugins: [],
};
