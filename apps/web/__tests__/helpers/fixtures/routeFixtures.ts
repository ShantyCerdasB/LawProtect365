/**
 * @fileoverview Route Fixtures - Reusable route paths and navigation data
 * @summary Pre-configured route paths for testing navigation
 * @description
 * Provides pre-configured route paths and navigation-related test data.
 * These fixtures ensure consistency when testing routing and navigation components.
 */

/**
 * @description Mock route paths for testing navigation.
 */
export const routeFixtures = {
  home: '/',
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    logout: '/auth/logout',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password',
  },
  documents: {
    list: '/documents',
    sign: '/documents/sign',
    view: '/documents/:id',
    create: '/documents/create',
    edit: '/documents/:id/edit',
  },
  users: {
    list: '/users',
    profile: '/users/profile',
    settings: '/users/settings',
  },
  admin: {
    dashboard: '/admin',
    users: '/admin/users',
    settings: '/admin/settings',
  },
} as const;

/**
 * @description Mock carousel slide data for testing.
 */
export const carouselSlideFixtures = {
  basic: {
    imageSrc: '/test-image.jpg',
    imageAlt: 'Test image',
    title: 'Test Title',
    description: 'Test description',
    buttons: [
      {
        label: 'Learn more',
        variant: 'primary' as const,
        href: '/learn-more',
      },
    ],
  },

  withMultipleButtons: {
    imageSrc: '/test-image.jpg',
    imageAlt: 'Test image',
    title: 'Test Title',
    description: 'Test description',
    buttons: [
      {
        label: 'Learn more',
        variant: 'primary' as const,
        href: '/learn-more',
      },
      {
        label: 'Contact us',
        variant: 'outline' as const,
        href: '/contact',
      },
    ],
  },
} as const;
