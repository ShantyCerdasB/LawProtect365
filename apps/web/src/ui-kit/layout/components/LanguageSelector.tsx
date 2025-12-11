/**
 * @fileoverview Language Selector - Component for changing application language
 * @summary Dropdown component to switch between supported languages
 * @description
 * Language selector component that uses the generic Dropdown component.
 * Displays country codes and translated language names.
 */

import { type ReactElement } from 'react';
import { useTranslation } from '@lawprotect/frontend-core';
import type { SupportedLanguage } from '@lawprotect/frontend-core';
import { GB, ES, JP, IT } from 'country-flag-icons/react/3x2';
import { CountryCode } from '../enums/CountryCode';
import type { LanguageConfig } from '../interfaces/LanguageSelectorInterfaces';
import { Dropdown } from '../../dropdown/Dropdown';
import type { DropdownItem } from '../../dropdown/interfaces/DropdownInterfaces';

interface LanguageWithFlag extends LanguageConfig {
  FlagComponent: React.ComponentType<{ className?: string; title?: string }>;
}

const languages: LanguageWithFlag[] = [
  { code: 'en', countryCode: CountryCode.GreatBritain, FlagComponent: GB },
  { code: 'es', countryCode: CountryCode.Spain, FlagComponent: ES },
  { code: 'ja', countryCode: CountryCode.Japan, FlagComponent: JP },
  { code: 'it', countryCode: CountryCode.Italy, FlagComponent: IT },
];

export function LanguageSelector(): ReactElement {
  const { i18n, t } = useTranslation('common');

  const currentLanguage = languages.find((lang) => lang.code === i18n.language) || languages[0];

  const dropdownItems: DropdownItem<SupportedLanguage>[] = languages.map((lang) => {
    const { FlagComponent } = lang;
    return {
      value: lang.code,
      label: (
        <>
          <FlagComponent className="w-5 h-4 rounded object-cover" title={lang.countryCode} />
          <span className="flex-1 text-xs font-semibold uppercase">{lang.countryCode}</span>
          {lang.code === i18n.language && (
            <svg
              className="w-4 h-4 text-emerald"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          )}
        </>
      ),
      selected: lang.code === i18n.language,
    };
  });

  const trigger = (isOpen: boolean) => {
    const { FlagComponent } = currentLanguage;
    return (
      <button
        type="button"
        className="bg-white/10 hover:bg-white/20 border border-white/30 rounded-lg px-3 py-1.5 text-sm text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald transition-colors flex items-center gap-2 min-w-[100px]"
        aria-label={t('languages.selectLanguage')}
        aria-expanded={isOpen}
      >
        <FlagComponent className="w-5 h-4 rounded object-cover" title={currentLanguage.countryCode} />
        <span className="flex-1 text-left text-xs font-semibold uppercase">{currentLanguage.countryCode}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    );
  };

  const handleLanguageChange = (lang: SupportedLanguage) => {
    i18n.changeLanguage(lang);
  };

  const currentLang = i18n.language as SupportedLanguage;

  return (
    <Dropdown
      items={dropdownItems}
      selectedValue={currentLang}
      onSelect={handleLanguageChange}
      trigger={trigger}
    />
  );
}
