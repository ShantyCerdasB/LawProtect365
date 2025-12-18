// @ts-nocheck
/**
 * @fileoverview DataTable Component Tests
 * @summary Tests for the DataTable component
 */

import { render, screen } from '@testing-library/react';
import { renderWithProviders } from '@/__tests__/helpers';
import { DataTable } from '@/ui-kit/tables/DataTable';

describe('DataTable', () => {
  type TestData = {
    id: number;
    name: string;
    email: string;
  };

  const columns = [
    { key: 'id' as keyof TestData, header: 'ID' },
    { key: 'name' as keyof TestData, header: 'Name' },
    { key: 'email' as keyof TestData, header: 'Email' },
  ];

  const data: TestData[] = [
    { id: 1, name: 'John Doe', email: 'john@example.com' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
  ];

  it('should render table with headers', () => {
    renderWithProviders(<DataTable data={data} columns={columns} />);
    
    expect(screen.getByText('ID')).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('should render table rows with data', () => {
    renderWithProviders(<DataTable data={data} columns={columns} />);
    
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
  });

  it('should use custom render function when provided', () => {
    const columnsWithRender = [
      { key: 'id' as keyof TestData, header: 'ID' },
      {
        key: 'name' as keyof TestData,
        header: 'Name',
        render: (row: TestData) => <strong>{row.name.toUpperCase()}</strong>,
      },
      { key: 'email' as keyof TestData, header: 'Email' },
    ];
    
    renderWithProviders(<DataTable data={data} columns={columnsWithRender} />);
    
    expect(screen.getByText('JOHN DOE')).toBeInTheDocument();
    expect(screen.getByText('JANE SMITH')).toBeInTheDocument();
  });

  it('should render empty table with no data', () => {
    renderWithProviders(<DataTable data={[]} columns={columns} />);
    
    expect(screen.getByText('ID')).toBeInTheDocument();
    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
  });

  it('should render table with proper structure', () => {
    const { container } = renderWithProviders(<DataTable data={data} columns={columns} />);
    
    const table = container.querySelector('table');
    expect(table).toBeInTheDocument();
    expect(table).toHaveClass('min-w-full', 'border', 'border-gray-200');
    
    const thead = container.querySelector('thead');
    expect(thead).toBeInTheDocument();
    
    const tbody = container.querySelector('tbody');
    expect(tbody).toBeInTheDocument();
  });

  it('should handle columns with ReactNode headers', () => {
    const columnsWithNodes = [
      { key: 'id' as keyof TestData, header: <span>Custom ID</span> },
      { key: 'name' as keyof TestData, header: 'Name' },
    ];
    
    renderWithProviders(<DataTable data={data} columns={columnsWithNodes} />);
    
    expect(screen.getByText('Custom ID')).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
  });

  it('should convert non-string values to strings', () => {
    const dataWithNumbers = [
      { id: 123, name: 'Test', email: 'test@example.com' },
    ];
    
    renderWithProviders(<DataTable data={dataWithNumbers} columns={columns} />);
    
    expect(screen.getByText('123')).toBeInTheDocument();
  });

  it('should render all rows for provided data', () => {
    const largeData: TestData[] = Array.from({ length: 5 }, (_, i) => ({
      id: i + 1,
      name: `User ${i + 1}`,
      email: `user${i + 1}@example.com`,
    }));
    
    renderWithProviders(<DataTable data={largeData} columns={columns} />);
    
    expect(screen.getByText('User 1')).toBeInTheDocument();
    expect(screen.getByText('User 5')).toBeInTheDocument();
  });
});



