import type { ReactElement } from 'react';

interface LogoProps {
  className?: string;
  useImage?: boolean;
}

export function Logo({ className = '', useImage = true }: LogoProps): ReactElement {
  if (useImage) {
    return (
      <img
        src="/lawProtectLogo.png"
        alt="Law Protect 365"
        className={`h-12 md:h-16 object-contain ${className}`}
      />
    );
  }

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="text-white font-semibold text-lg leading-tight">LAW PROTECT</div>
      <div className="w-full h-px bg-white my-1" />
      <div className="text-white font-semibold text-lg">365</div>
    </div>
  );
}

