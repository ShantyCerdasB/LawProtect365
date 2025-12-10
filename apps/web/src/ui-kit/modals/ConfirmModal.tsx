import { PropsWithChildren } from 'react';
import { Button } from '../buttons';

type Props = PropsWithChildren<{
  title?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}>;

export function ConfirmModal({ title, children, onConfirm, onCancel }: Props) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40">
      <div className="bg-white p-4 rounded shadow-lg min-w-[280px] space-y-3">
        {title && <h2 className="text-lg font-semibold">{title}</h2>}
        <div>{children}</div>
        <div className="flex gap-2 justify-end">
          <Button onClick={onCancel}>Cancelar</Button>
          <Button onClick={onConfirm}>Confirmar</Button>
        </div>
      </div>
    </div>
  );
}

