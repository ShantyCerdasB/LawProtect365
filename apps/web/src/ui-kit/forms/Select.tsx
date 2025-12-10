import { SelectHTMLAttributes } from 'react';

type Option = { value: string; label: string };
type Props = SelectHTMLAttributes<HTMLSelectElement> & { label?: string; options?: Option[] };

export function Select({ label, options = [], ...rest }: Props) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      {label && <span className="font-medium">{label}</span>}
      <select {...rest} className={`border rounded px-3 py-2 ${rest.className || ''}`.trim()}>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}

