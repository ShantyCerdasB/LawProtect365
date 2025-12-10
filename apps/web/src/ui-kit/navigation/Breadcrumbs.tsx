import { ReactNode } from 'react';

type Crumb = { label: ReactNode; href?: string };
type Props = { items: Crumb[] };

export function Breadcrumbs({ items }: Props) {
  return (
    <nav className="text-sm text-gray-600">
      <ol className="flex items-center gap-2">
        {items.map((item, idx) => (
          <li key={idx} className="flex items-center gap-2">
            {item.href ? <a href={item.href} className="text-blue-600 hover:underline">{item.label}</a> : item.label}
            {idx < items.length - 1 && <span>/</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}

