import { PropsWithChildren, ReactNode } from 'react';

type Props = PropsWithChildren<{ title?: ReactNode; actions?: ReactNode }>;

export function Section({ title, actions, children }: Props) {
  return (
    <section className="bg-white rounded shadow-sm p-4 space-y-2">
      {(title || actions) && (
        <div className="flex items-center justify-between">
          {title && <h3 className="text-lg font-semibold">{title}</h3>}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

