import { ButtonHTMLAttributes, ReactNode } from 'react';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { icon: ReactNode };

export function IconButton({ icon, children, ...rest }: Props) {
  return (
    <button {...rest} className={`p-2 rounded inline-flex items-center gap-2 ${rest.className || ''}`.trim()}>
      {icon}
      {children}
    </button>
  );
}

