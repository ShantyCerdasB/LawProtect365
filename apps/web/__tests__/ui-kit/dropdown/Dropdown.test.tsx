// @ts-nocheck
/**
 * @fileoverview Dropdown Component Tests
 * @summary Tests for the Dropdown component
 */

/// <reference types="@testing-library/jest-dom" />
import React from 'react';
import { describe, it, expect, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/__tests__/helpers';
import { Dropdown } from '@ui-kit/dropdown/Dropdown';
import type { DropdownItem } from '@ui-kit/dropdown/interfaces/DropdownInterfaces';

describe('Dropdown', () => {
  const items: DropdownItem<string>[] = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3' },
  ];

  const trigger = (isOpen: boolean) => (
    <button>{isOpen ? 'Close' : 'Open'}</button>
  );

  it('should render dropdown with trigger', () => {
    renderWithProviders(
      <Dropdown items={items} selectedValue="option1" onSelect={jest.fn()} trigger={trigger} />
    );
    
    expect(screen.getByText('Open')).toBeInTheDocument();
  });

  it('should open dropdown when trigger is clicked', async () => {
    const user = userEvent.setup();
    
    renderWithProviders(
      <Dropdown items={items} selectedValue="option1" onSelect={jest.fn()} trigger={trigger} />
    );
    
    await user.click(screen.getByText('Open'));
    
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();
    expect(screen.getByText('Option 3')).toBeInTheDocument();
  });

  it('should close dropdown when item is selected', async () => {
    const user = userEvent.setup();
    const onSelect = jest.fn();
    
    renderWithProviders(
      <Dropdown items={items} selectedValue="option1" onSelect={onSelect} trigger={trigger} />
    );
    
    await user.click(screen.getByText('Open'));
    await user.click(screen.getByText('Option 2'));
    
    expect(onSelect).toHaveBeenCalledWith('option2');
    expect(screen.queryByText('Option 2')).not.toBeInTheDocument();
  });

  it('should highlight selected item', async () => {
    const user = userEvent.setup();
    
    renderWithProviders(
      <Dropdown items={items} selectedValue="option2" onSelect={jest.fn()} trigger={trigger} />
    );
    
    await user.click(screen.getByText('Open'));
    
    const selectedItem = screen.getByText('Option 2').closest('button');
    expect(selectedItem).toHaveClass('bg-emerald/20', 'text-white', 'font-medium');
  });

  it('should close dropdown when clicking outside', async () => {
    const user = userEvent.setup();
    
    renderWithProviders(
      <div>
        <Dropdown items={items} selectedValue="option1" onSelect={jest.fn()} trigger={trigger} />
        <div>Outside</div>
      </div>
    );
    
    await user.click(screen.getByText('Open'));
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    
    await user.click(screen.getByText('Outside'));
    
    expect(screen.queryByText('Option 1')).not.toBeInTheDocument();
  });

  it('should use selected property to highlight item', async () => {
    const user = userEvent.setup();
    const itemsWithSelected: DropdownItem<string>[] = [
      { value: 'option1', label: 'Option 1', selected: true },
      { value: 'option2', label: 'Option 2' },
    ];
    
    renderWithProviders(
      <Dropdown items={itemsWithSelected} onSelect={jest.fn()} trigger={trigger} />
    );
    
    await user.click(screen.getByText('Open'));
    
    const selectedItem = screen.getByText('Option 1').closest('button');
    expect(selectedItem).toHaveClass('bg-emerald/20');
  });

  it('should apply custom className', () => {
    const { container } = renderWithProviders(
      <Dropdown
        items={items}
        selectedValue="option1"
        onSelect={jest.fn()}
        trigger={trigger}
        className="custom-class"
      />
    );
    
    const dropdown = container.firstChild as HTMLElement;
    expect(dropdown).toHaveClass('custom-class');
  });

  it('should apply custom dropdownClassName', async () => {
    const user = userEvent.setup();
    
    renderWithProviders(
      <Dropdown
        items={items}
        selectedValue="option1"
        onSelect={jest.fn()}
        trigger={trigger}
        dropdownClassName="custom-dropdown"
      />
    );
    
    await user.click(screen.getByText('Open'));
    
    const dropdown = screen.getByText('Option 1').closest('div[class*="absolute"]');
    expect(dropdown).toHaveClass('custom-dropdown');
  });

  it('should toggle dropdown when trigger is clicked twice', async () => {
    const user = userEvent.setup();
    
    renderWithProviders(
      <Dropdown items={items} selectedValue="option1" onSelect={jest.fn()} trigger={trigger} />
    );
    
    await user.click(screen.getByText('Open'));
    expect(screen.getByText('Close')).toBeInTheDocument();
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    
    await user.click(screen.getByText('Close'));
    expect(screen.getByText('Open')).toBeInTheDocument();
    expect(screen.queryByText('Option 1')).not.toBeInTheDocument();
  });
});


