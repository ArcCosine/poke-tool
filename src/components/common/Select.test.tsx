import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Select } from './Select';

describe('Select Component', () => {
  it('renders options correctly', () => {
    render(
      <Select data-testid="select-component">
        <option value="1">Option 1</option>
        <option value="2">Option 2</option>
      </Select>
    );
    expect(screen.getByText('Option 1')).toBeDefined();
    expect(screen.getByText('Option 2')).toBeDefined();
  });

  it('renders label when provided', () => {
    render(
      <Select id="test-select" label="Choose number">
        <option value="1">Option 1</option>
      </Select>
    );
    expect(screen.getByLabelText('Choose number')).toBeDefined();
  });

  it('triggers onChange handler when option is selected', () => {
    const handleChange = vi.fn();
    render(
      <Select data-testid="select-component" onChange={handleChange}>
        <option value="1">Option 1</option>
        <option value="2">Option 2</option>
      </Select>
    );
    const select = screen.getByTestId('select-component');
    fireEvent.change(select, { target: { value: '2' } });
    expect(handleChange).toHaveBeenCalled();
  });

  it('is disabled when disabled prop is true', () => {
    render(
      <Select data-testid="select-component" disabled>
        <option value="1">Option 1</option>
      </Select>
    );
    const select = screen.getByTestId('select-component') as HTMLSelectElement;
    expect(select.disabled).toBe(true);
  });

  it('has premium input class', () => {
    render(
      <Select data-testid="select-component">
        <option value="1">Option 1</option>
      </Select>
    );
    const select = screen.getByTestId('select-component');
    expect(select.className).toContain('input-premium');
  });
});
