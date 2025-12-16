import { SelectHTMLAttributes, useId } from 'react';

type Option = { value: string; label: string };
type Props = SelectHTMLAttributes<HTMLSelectElement> & { label?: string; options?: Option[] };

export function Select({ label, options = [], value, className, ...rest }: Props) {
  const id = useId();
  const selectId = rest.id || id;

  const selectProps: SelectHTMLAttributes<HTMLSelectElement> = {
    ...rest,
    id: selectId,
  };

  if (value !== undefined) {
    selectProps.value = value ?? '';
  }

  const combinedClassName = `border rounded px-3 py-2 ${className || ''}`.trim();

  return (
    <label className="flex flex-col gap-1 text-sm" htmlFor={selectId}>
      {label && <span className="font-medium">{label}</span>}
      <select {...selectProps} className={combinedClassName}>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}

