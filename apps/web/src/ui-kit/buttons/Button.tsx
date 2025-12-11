import { ButtonHTMLAttributes } from 'react';

type Props = ButtonHTMLAttributes<HTMLButtonElement>;

export function Button(props: Props) {
  return <button {...props} className={`px-3 py-2 rounded ${props.className || ''}`.trim()} />;
}

