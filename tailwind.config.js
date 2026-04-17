/**
 * tailwind.config.js
 * Complex, production-ready TailwindCSS configuration for Flourishing Souls Foundation.
 *
 * Features:
 * - Enterprise-grade dark mode (class & attribute)
 * - Custom color palette matching brand guidelines
 * - Extensive extensions for typography, forms, line clamp, aspect ratio, etc.
 * - Safelist for dynamic classes in production
 * - Custom responsive breakpoints
 * - Integration with inter, system fonts
 * - Thematic support for light/dark/UI-aware design tokens
 * - Extendable for plugin ecosystem (forms, typography, etc.)
 * - Performance: PurgeCSS enabled for production
 * - Animations, transitions, accessibility
 */

const defaultTheme = require('tailwindcss/defaultTheme');
const colors = require('tailwindcss/colors');

module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
    './public/**/*.html',
  ],
  darkMode: ['class', '[data-theme="dark"]'], // hybrid: class and data attribute
  theme: {
    extend: {
      fontFamily: {
        // Use Inter as primary sans font, then fall back to Tailwind/system stack
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
        heading: ['Inter', 'ui-sans-serif', 'system-ui'],
        // For body, etc. — expand if you add more custom fonts
      },
      container: {
        center: true,
        padding: {
          DEFAULT: '1.25rem',
          sm: '2rem',
          lg: '3rem',
          xl: '4rem',
          '2xl': '5rem',
        },
        screens: {
          '2xl': '1440px',
        },
      },
      // Brand Color Palette
      colors: {
        // Primary (brand) and secondary colors
        primary: {
          DEFAULT: '#2522D5',
          light: '#4640df',
          dark: '#18192f',
          50:  '#f5f6ff',
          100: '#e6e7fa',
          200: '#aeb8fd',
          300: '#787cfb',
          400: '#4640df',
          500: '#2522d5',
          600: '#1a19ad',
          700: '#15177e',
          800: '#161856',
          900: '#18192f',
        },
        accent: {
          DEFAULT: '#ffb703',
          light: '#ffe89b',
          dark: '#cc7900',
        },
        // Supporting, status, and grayscale palette
        success: colors.green,
        warning: colors.amber,
        error: colors.red,
        info: colors.sky,
        muted: {
          50:  '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
        brand: {
          DEFAULT: '#2522D5',
          'light': '#787cfb',
          'dark': '#15177e'
        },
        background: {
          DEFAULT: '#fbfbff',
          dark: '#18192f'
        },
        foreground: {
          DEFAULT: '#18192f',
          light: '#fbfbff'
        }
      },
      borderRadius: {
        'xs': '0.175rem',
        'md': '0.5rem',
        'lg': '0.85rem',
        'xl': '1.25rem',
        '3xl': '2rem'
      },
      spacing: {
        '128': '32rem',
        '144': '36rem',
      },
      boxShadow: {
        xs: '0 1px 2px 0 rgba(20, 18, 65, 0.04)',
        md: '0 4px 24px rgba(37, 34, 213, 0.10)',
        xl: '0 6px 32px 0 rgba(68, 56, 202, 0.18)',
        glow: '0 0 0 4px #ffb70322',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
        'fade-up': {
          '0%': {
            opacity: 0,
            transform: 'translateY(25px)'
          },
          '100%': {
            opacity: 1,
            transform: 'translateY(0)'
          }
        }
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-in',
        'fade-up': 'fade-up 0.6s cubic-bezier(.6,.3,0,1.2)'
      },
      // For complex project, responsive breakpoints can be tweaked
      screens: {
        'xs': '420px',
        ...defaultTheme.screens,
        '3xl': '1920px',
      },
      zIndex: {
        60: 60,
        70: 70,
        80: 80,
        90: 90,
        100: 100,
      },
      minHeight: {
        'screen-75': '75vh',
      },
      typography: (theme) => ({
        DEFAULT: {
          css: {
            color: theme('colors.foreground.DEFAULT'),
            a: {
              color: theme('colors.primary.DEFAULT'),
              textDecoration: 'underline',
              fontWeight: '500',
              '&:hover': {
                color: theme('colors.primary.700'),
              },
            },
            h1: { fontWeight: '800', letterSpacing: '-0.03em' },
            h2: { fontWeight: '700', letterSpacing: '-0.02em' },
            h3: { fontWeight: '700', letterSpacing: '-0.02em' },
            code: {
              backgroundColor: theme('colors.muted.100'),
              color: theme('colors.primary.DEFAULT'),
              borderRadius: '0.375rem',
              padding: '0.15em 0.35em',
              fontWeight: '400',
              fontSize: '0.98em',
            },
          },
        },
        dark: {
          css: {
            color: theme('colors.foreground.light'),
            a: { color: theme('colors.accent.DEFAULT') },
            h1: { color: theme('colors.foreground.light') },
            h2: { color: theme('colors.foreground.light') },
            h3: { color: theme('colors.foreground.light') },
            blockquote: {
              color: theme('colors.muted.100'),
              borderLeftColor: theme('colors.primary.400'),
            },
            code: {
              backgroundColor: theme('colors.primary.800'),
              color: theme('colors.accent.DEFAULT'),
            }
          }
        }
      })
    },
  },
  safelist: [
    {
      pattern: /bg-(primary|accent|success|error|warning|info)-(50|100|200|300|400|500|600|700|800|900)/,
      variants: ['hover', 'dark', 'active'],
    },
    'prose',
    'prose-lg',
    'prose-xl',
    'prose-invert',
    'text-primary',
    'text-accent',
    'bg-primary',
    'bg-accent',
    'border-primary',
    'border-accent',
  ],
  plugins: [
    require('@tailwindcss/forms'),            // Elegant form elements
    require('@tailwindcss/typography'),       // for prose (markdown/content)
    require('@tailwindcss/line-clamp'),       // Line clamp for text truncation
    require('@tailwindcss/aspect-ratio'),     // Maintain image/video aspect ratios
    // Add any other plugins as production needs grow
  ],
  corePlugins: {
    preflight: true,   // keep the TailwindCSS base layer
  }
};

