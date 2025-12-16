import { InputHTMLAttributes, useId } from 'react';

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  helpText?: string;
};

export function TextField({ label, helpText, ...rest }: Props) {
  const id = useId();
  const inputId = rest.id || id;
  const helpTextId = helpText ? `${inputId}-help` : undefined;

  return (
    <label className="flex flex-col gap-1 text-sm" htmlFor={inputId}>
      {label && <span className="font-medium">{label}</span>}
      <input 
        {...rest} 
        id={inputId}
        aria-describedby={helpTextId}
        className={`border rounded px-3 py-2 ${rest.className || ''}`.trim()} 
      />
      {helpText && <span id={helpTextId} className="text-xs text-slate-500">{helpText}</span>}
    </label>
  );
}

