/**
 * @fileoverview Auth Module Routes - Login and authentication entrypoints
 * @summary Exposes the login screen route for the auth module
 * @description
 * The auth module is responsible for login, logout and session management.
 * This file wires the login page into the central router.
 */

import { FormEvent, useMemo, useState, type ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageLayout } from '../../ui-kit/layout/PageLayout';
import { TextField } from '../../ui-kit/forms/TextField';
import { Button } from '../../ui-kit/buttons/Button';
import { createInterceptedHttpClient } from '@lawprotect/frontend-core';
import { LocalStorageAdapter } from '../../app/adapters/LocalStorageAdapter';
import { env } from '../../app/config/env';

/**
 * @description Simple login page with email/password and social providers.
 * @returns JSX element with the login form
 */
function LoginPage(): ReactElement {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const storage = useMemo(() => new LocalStorageAdapter(), []);
  // HttpClient instance created here to demonstrate frontend-core integration.
  // It will be used by future auth flows (e.g., fetching /me after OAuth redirect).
  useMemo(
    () =>
      createInterceptedHttpClient({
        baseUrl: env.apiBaseUrl,
        fetchImpl: window.fetch,
        getAuthToken: async () => storage.get<string>('auth_token')
      }),
    [storage]
  );

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    // TODO: call real email/password auth endpoint.
    await storage.set('auth_token', 'dev-email-password-token');
    navigate('/admin');
  };

  return (
    <PageLayout
      title={
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
            Sign in
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Use your work email to access the legal platform.
          </p>
        </div>
      }
    >
      <form
        onSubmit={handleSubmit}
        className="mx-auto flex max-w-sm flex-col gap-4 rounded-xl border border-slate-200 bg-white/80 p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/70"
      >
        <TextField
          type="email"
          label="Email"
          placeholder="you@example.com"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <TextField
          type="password"
          label="Password"
          placeholder="••••••••"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button
          type="submit"
          className="mt-2 w-full rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
        >
          Sign in
        </Button>

        <div className="mt-4 space-y-2 border-t border-slate-200 pt-4 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
          <p className="font-medium text-slate-600 dark:text-slate-300">Or continue with</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              className="flex-1 rounded-md border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
              // TODO: redirect to real Google OAuth URL and let backend set the auth token.
              onClick={async () => {
                await storage.set('auth_token', 'dev-google-token');
                navigate('/admin');
              }}
            >
              Continue with Google
            </Button>
            <Button
              type="button"
              className="flex-1 rounded-md border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
              onClick={async () => {
                await storage.set('auth_token', 'dev-outlook-token');
                navigate('/admin');
              }}
            >
              Continue with Outlook
            </Button>
            <Button
              type="button"
              className="flex-1 rounded-md border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
              onClick={async () => {
                await storage.set('auth_token', 'dev-apple-token');
                navigate('/admin');
              }}
            >
              Continue with Apple
            </Button>
          </div>
        </div>
      </form>
    </PageLayout>
  );
}

/**
 * @description Returns the route configuration for the auth module.
 * @returns Array of React Router route objects for auth
 */
export function authRoutes() {
  return [
    {
      path: '/auth/login',
      element: <LoginPage />
    }
  ];
}


