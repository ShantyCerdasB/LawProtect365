import { InputHTMLAttributes } from 'react';

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  helpText?: string;
};

export function TextField({ label, helpText, ...rest }: Props) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      {label && <span className="font-medium">{label}</span>}
      <input {...rest} className={`border rounded px-3 py-2 ${rest.className || ''}`.trim()} />
      {helpText && <span className="text-xs text-slate-500">{helpText}</span>}
    </label>
  );
}

