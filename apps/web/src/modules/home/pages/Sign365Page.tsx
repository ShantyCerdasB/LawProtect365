/**
 * @fileoverview Sign 365 Page - Landing page for the Sign 365 feature
 * @summary Displays the Sign 365 service introduction with process steps
 * @description
 * Landing page that introduces the Sign 365 electronic signature service.
 * Shows a hero section, three process steps with icons, and a call-to-action button.
 */

import { useNavigate } from 'react-router-dom';
import type { ReactElement } from 'react';
import { useTranslation } from '@lawprotect/frontend-core';
import { IconWrapper } from '../../../ui-kit/icons';
import { Button } from '../../../ui-kit/buttons';
import { HeroSection, StepCard } from '../components';

/**
 * @description Renders the Sign 365 landing page with hero section, process steps, and call-to-action.
 * @returns {ReactElement} Complete Sign 365 landing page with responsive layout
 */
export function Sign365Page(): ReactElement {
  const { t } = useTranslation('layout');
  const navigate = useNavigate();

  /**
   * @description Handles navigation to the documents page when the "Start signing now" button is clicked.
   */
  const handleStartSigning = () => {
    navigate('/documents');
  };

  return (
    <div className="min-h-screen bg-white py-12 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">
        <HeroSection
          title={t('sign365.hero.title')}
          subtitle={t('sign365.hero.subtitle')}
          description={t('sign365.hero.description')}
        />

        <div className="relative mb-12">
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16 relative z-10">
            <StepCard
              icon={
                <IconWrapper
                  icon={
                    <img
                      src="/UploadDocument.svg"
                      alt="Upload document"
                      className="w-full h-full"
                    />
                  }
                />
              }
              title={t('sign365.steps.addDocument.title')}
              description={t('sign365.steps.addDocument.description')}
            />

            <div className="relative flex items-center justify-center">
              <div className="absolute top-[30%] left-[50%] md:left-[114%] transform -translate-x-1/2 -translate-y-1/2 -z-10 pointer-events-none w-[120%] md:w-[350%] max-w-[600px] md:max-w-[1000px] opacity-0 md:opacity-50">
                <img
                  src="/Sign365Lines.svg"
                  alt="Decorative lines"
                  className="w-full h-auto"
                />
              </div>
              <StepCard
                icon={
                  <IconWrapper
                    icon={
                      <img
                        src="/UploadDocument.svg"
                        alt="Share document"
                        className="w-full h-full"
                      />
                    }
                  />
                }
                title={t('sign365.steps.shareDocument.title')}
                description={t('sign365.steps.shareDocument.description')}
              />
            </div>

            <StepCard
              icon={
                <IconWrapper
                  icon={
                    <img
                      src="/DownloadDocument.svg"
                      alt="Save document"
                      className="w-full h-full"
                    />
                  }
                />
              }
              title={t('sign365.steps.saveDocument.title')}
              description={t('sign365.steps.saveDocument.description')}
            />
          </div>
        </div>

        <div className="flex justify-center">
          <Button
            variant="primary"
            size="lg"
            bgColor="#a32439"
            hoverBgColor="#8a1e30"
            onClick={handleStartSigning}
            className="px-16"
          >
            {t('sign365.cta.button')}
          </Button>
        </div>
      </div>
    </div>
  );
}

