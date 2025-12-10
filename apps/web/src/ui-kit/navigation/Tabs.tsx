import { ReactNode } from 'react';

type Tab = { key: string; label: ReactNode };
type Props = { tabs: Tab[]; activeKey: string; onChange?: (key: string) => void };

export function Tabs({ tabs, activeKey, onChange }: Props) {
  return (
    <div className="flex gap-2 border-b">
      {tabs.map((tab) => {
        const isActive = tab.key === activeKey;
        return (
          <button
            key={tab.key}
            className={`px-3 py-2 border-b-2 ${isActive ? 'border-blue-600 font-semibold' : 'border-transparent'}`}
            onClick={() => onChange?.(tab.key)}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

