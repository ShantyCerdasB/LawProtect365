type Props = { title?: string; message: string; tone?: 'info' | 'success' | 'warning' | 'error' };

export function Alert({ title, message, tone = 'info' }: Props) {
  const colors: Record<typeof tone, string> = {
    info: 'bg-blue-50 text-blue-800 border-blue-200',
    success: 'bg-green-50 text-green-800 border-green-200',
    warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
    error: 'bg-red-50 text-red-800 border-red-200'
  } as const;

  return (
    <div className={`border rounded p-3 ${colors[tone]}`}>
      {title && <div className="font-semibold mb-1">{title}</div>}
      <div>{message}</div>
    </div>
  );
}

