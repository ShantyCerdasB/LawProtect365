// @ts-nocheck
/**
 * @fileoverview Tabs Component Tests
 * @summary Tests for the Tabs component
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/__tests__/helpers';
import { Tabs } from '@ui-kit/navigation/Tabs';

describe('Tabs', () => {
  const tabs = [
    { key: 'tab1', label: 'Tab 1' },
    { key: 'tab2', label: 'Tab 2' },
    { key: 'tab3', label: 'Tab 3' },
  ];

  it('should render all tabs', () => {
    renderWithProviders(<Tabs tabs={tabs} activeKey="tab1" />);
    
    expect(screen.getByText('Tab 1')).toBeInTheDocument();
    expect(screen.getByText('Tab 2')).toBeInTheDocument();
    expect(screen.getByText('Tab 3')).toBeInTheDocument();
  });

  it('should highlight active tab', () => {
    renderWithProviders(<Tabs tabs={tabs} activeKey="tab2" />);
    
    const tab1 = screen.getByText('Tab 1').closest('button');
    const tab2 = screen.getByText('Tab 2').closest('button');
    
    expect(tab1).not.toHaveClass('border-blue-600', 'font-semibold');
    expect(tab2).toHaveClass('border-blue-600', 'font-semibold');
  });

  it('should call onChange when tab is clicked', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    
    renderWithProviders(<Tabs tabs={tabs} activeKey="tab1" onChange={onChange} />);
    
    await user.click(screen.getByText('Tab 2'));
    
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('tab2');
  });

  it('should not call onChange when active tab is clicked', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    
    renderWithProviders(<Tabs tabs={tabs} activeKey="tab1" onChange={onChange} />);
    
    await user.click(screen.getByText('Tab 1'));
    
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('tab1');
  });

  it('should work without onChange handler', async () => {
    const user = userEvent.setup();
    
    renderWithProviders(<Tabs tabs={tabs} activeKey="tab1" />);
    
    await user.click(screen.getByText('Tab 2'));
    
    expect(screen.getByText('Tab 2')).toBeInTheDocument();
  });

  it('should render tabs with ReactNode labels', () => {
    const tabsWithNodes = [
      { key: 'tab1', label: <span>Custom Tab</span> },
      { key: 'tab2', label: 'Text Tab' },
    ];
    
    renderWithProviders(<Tabs tabs={tabsWithNodes} activeKey="tab1" />);
    
    expect(screen.getByText('Custom Tab')).toBeInTheDocument();
    expect(screen.getByText('Text Tab')).toBeInTheDocument();
  });

  it('should have proper border styling for inactive tabs', () => {
    renderWithProviders(<Tabs tabs={tabs} activeKey="tab1" />);
    
    const tab2 = screen.getByText('Tab 2').closest('button');
    
    expect(tab2).toHaveClass('border-transparent');
    expect(tab2).not.toHaveClass('border-blue-600');
  });
});



