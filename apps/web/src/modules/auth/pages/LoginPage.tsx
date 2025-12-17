/**
 * @fileoverview Login Page - OAuth authentication page
 * @summary Main login page with OAuth provider buttons
 * @description
 * Displays a split-screen login page with an image on the left and OAuth authentication
 * buttons (Google, Outlook, Apple) on the right. Handles OAuth flow initiation by redirecting
 * to Cognito Hosted UI.
 */

import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';
import { useCognitoAuth, useTranslation } from '@lawprotect/frontend-core';
import { env } from '../../../app/config/env';
import { LoginLayout } from '../components/LoginLayout';
import { OAuthButton } from '../components/OAuthButton';

/**
 * @description Renders the main login page with OAuth authentication options.
 * @returns {ReactElement} Login page component with split-screen layout
 */
export function LoginPage(): ReactElement {
  const { t } = useTranslation('auth');
  const cognitoConfig = {
    userPoolId: env.cognito.userPoolId,
    clientId: env.cognito.clientId,
    domain: env.cognito.domain,
    region: env.cognito.region,
    callbackUrl: env.cognito.callbackUrl,
  };

  const { initiateAuth } = useCognitoAuth({ config: cognitoConfig });

  const handleGoogleLogin = () => {
    initiateAuth('google');
  };

  const handleOutlookLogin = () => {
    initiateAuth('outlook');
  };

  const handleAppleLogin = () => {
    initiateAuth('apple');
  };

  return (
    <LoginLayout>
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-blue">
            {t('login.signInToAccount')}
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            {t('login.chooseSignInMethod')}
          </p>
        </div>

        <div className="space-y-3">
          <OAuthButton provider="google" onClick={handleGoogleLogin} />
          <OAuthButton provider="outlook" onClick={handleOutlookLogin} />
          <OAuthButton provider="apple" onClick={handleAppleLogin} />
        </div>

        <div className="text-center text-xs text-slate-500 dark:text-slate-400">
          <p>
            {(() => {
              const text = t('login.agreeTerms');
              const termsPatterns = [
                'Terms of Service',
                'Términos de Servicio',
                'Termini di Servizio',
                '利用規約',
              ];
              const policyPatterns = [
                'Privacy Policy',
                'Política de Privacidad',
                'Informativa sulla Privacy',
                'プライバシーポリシー',
              ];
              
              let termsIndex = -1;
              let termsPattern = '';
              let policyIndex = -1;
              let policyPattern = '';
              
              for (const pattern of termsPatterns) {
                const index = text.indexOf(pattern);
                if (index !== -1) {
                  termsIndex = index;
                  termsPattern = pattern;
                  break;
                }
              }
              
              for (const pattern of policyPatterns) {
                const index = text.indexOf(pattern);
                if (index !== -1) {
                  policyIndex = index;
                  policyPattern = pattern;
                  break;
                }
              }
              
              if (termsIndex === -1 || policyIndex === -1) {
                return text;
              }
              
              return (
                <>
                  {text.substring(0, termsIndex)}
                  <Link
                    to="/"
                    className="underline hover:text-blue transition-colors"
                  >
                    {termsPattern}
                  </Link>
                  {text.substring(termsIndex + termsPattern.length, policyIndex)}
                  <Link
                    to="/"
                    className="underline hover:text-blue transition-colors"
                  >
                    {policyPattern}
                  </Link>
                  {text.substring(policyIndex + policyPattern.length)}
                </>
              );
            })()}
          </p>
        </div>
      </div>
    </LoginLayout>
  );
}

