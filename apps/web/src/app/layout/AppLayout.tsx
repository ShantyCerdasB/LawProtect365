import { type ReactElement } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from '../../ui-kit/layout/Header';

export function AppLayout(): ReactElement {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}

