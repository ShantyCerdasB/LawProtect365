/**
 * @fileoverview Callback Page - OAuth callback handler
 * @summary Handles OAuth callback from Cognito Hosted UI
 * @description
 * Processes the OAuth callback from Cognito Hosted UI, exchanges the authorization code
 * for tokens, stores them in the auth store, and redirects to the dashboard.
 * Handles errors and displays appropriate messages.
 */

import { useEffect, useState, type ReactElement } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCognitoAuth, useTranslation } from '@lawprotect/frontend-core';
import { env } from '../../../app/config/env';
import { useAuthStore } from '../../../app/store/useAuthStore';
import { createInterceptedHttpClient } from '@lawprotect/frontend-core';
import { LocalStorageAdapter } from '../../../app/adapters/LocalStorageAdapter';
import { getMe } from '@lawprotect/frontend-core';
import { LoginLayout } from '../components/LoginLayout';

/**
 * @description Renders the OAuth callback page that processes authentication.
 * @returns {ReactElement} Callback page component
 */
export function CallbackPage(): ReactElement {
  const { t } = useTranslation('auth');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setTokens, login } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);

  const cognitoConfig = {
    userPoolId: env.cognito.userPoolId,
    clientId: env.cognito.clientId,
    domain: env.cognito.domain,
    region: env.cognito.region,
    callbackUrl: env.cognito.callbackUrl,
  };

  const { handleCallback } = useCognitoAuth({ config: cognitoConfig });

  useEffect(() => {
    const processCallback = async () => {
      try {
        const code = searchParams.get('code');
        const errorParam = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        if (errorParam) {
          throw new Error(errorDescription || errorParam);
        }

        if (!code) {
          throw new Error(t('callback.noAuthorizationCode'));
        }

        const tokenResponse = await handleCallback(code);

        const expiresAt = Date.now() + tokenResponse.expires_in * 1000;

        setTokens({
          idToken: tokenResponse.id_token,
          accessToken: tokenResponse.access_token,
          refreshToken: tokenResponse.refresh_token,
          expiresAt,
        });

        const storage = new LocalStorageAdapter();
        await storage.set('auth_token', tokenResponse.access_token);
        await storage.set('id_token', tokenResponse.id_token);
        await storage.set('refresh_token', tokenResponse.refresh_token);

        const httpClient = createInterceptedHttpClient({
          baseUrl: env.apiBaseUrl,
          fetchImpl: window.fetch,
          getAuthToken: async () => tokenResponse.access_token,
        });

        await getMe(httpClient);

        await login();
        navigate('/dashboard');
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : t('callback.authenticationFailed');
        setError(errorMessage);
        setIsProcessing(false);
      }
    };

    processCallback();
  }, [searchParams, handleCallback, setTokens, login, navigate]);

  if (isProcessing) {
    return (
      <LoginLayout>
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 dark:border-slate-50"></div>
          <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">
            {t('callback.completingAuthentication')}
          </p>
        </div>
      </LoginLayout>
    );
  }

  if (error) {
    return (
      <LoginLayout>
        <div className="text-center space-y-4">
          <div className="text-red-600 dark:text-red-400">
            <p className="font-semibold">{t('callback.authenticationError')}</p>
            <p className="text-sm mt-2">{error}</p>
          </div>
          <button
            onClick={() => navigate('/auth/login')}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-100"
          >
            {t('callback.returnToLogin')}
          </button>
        </div>
      </LoginLayout>
    );
  }

  return (
    <LoginLayout>
      <div className="text-center">
        <p className="text-slate-600 dark:text-slate-400">{t('callback.redirecting')}</p>
      </div>
    </LoginLayout>
  );
}

