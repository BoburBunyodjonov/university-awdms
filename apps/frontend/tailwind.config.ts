import type { Config } from 'tailwindcss';

// §9.5 status colors mirrored here as semantic tokens. Keep in sync with
// STATUS_COLOR in packages/shared/src/lib/constants.ts.
const config: Config = {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
    '../../packages/shared/src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        status: {
          assigned: '#10b981',
          unassigned: '#ef4444',
          invalid: '#991b1b',
          draft: '#71717a',
          ready: '#3b82f6',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
};

export default config;
