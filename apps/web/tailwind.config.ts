/**
 * @fileoverview Tailwind CSS Configuration - Custom color palette configuration
 * @summary Defines custom colors for Tailwind CSS utility classes
 * @description
 * This configuration file extends Tailwind CSS with custom colors from the
 * application's color palette. Colors are mapped to Tailwind utility classes
 * (bg-*, text-*, border-*, etc.)
 */

import type { Config } from 'tailwindcss';

const config: Config = {
  theme: {
    extend: {
      colors: {
        blue: {
          DEFAULT: '#1d4878',
          dark: '#003454',
        },
        burgundy: {
          DEFAULT: '#a32439',
        },
        emerald: {
          DEFAULT: '#5e9594',
          dark: '#12626d',
        },
        gray: {
          DEFAULT: '#444b59',
        },
        white: {
          DEFAULT: '#ffffff',
        },
      },
    },
  },
};

export default config;


