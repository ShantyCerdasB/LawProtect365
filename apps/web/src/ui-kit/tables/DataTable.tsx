import { ReactNode } from 'react';

type Column<T> = { key: keyof T; header: ReactNode; render?: (row: T) => ReactNode };
type Props<T> = { data: T[]; columns: Column<T>[] };

export function DataTable<T>({ data, columns }: Props<T>) {
  return (
    <table className="min-w-full border border-gray-200">
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={String(col.key)} className="px-3 py-2 text-left border-b">
              {col.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, idx) => (
          <tr key={idx} className="border-b">
            {columns.map((col) => (
              <td key={String(col.key)} className="px-3 py-2">
                {col.render ? col.render(row) : String(row[col.key])}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

