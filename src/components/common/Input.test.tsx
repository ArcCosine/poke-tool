import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Input } from './Input';

describe('Input Component', () => {
  it('renders input with value correctly', () => {
    render(<Input data-testid="input-component" value="test value" readOnly />);
    const input = screen.getByTestId('input-component') as HTMLInputElement;
    expect(input.value).toBe('test value');
  });

  it('renders label when provided', () => {
    render(<Input id="test-input" label="Enter name" />);
    expect(screen.getByLabelText('Enter name')).toBeDefined();
  });

  it('triggers onChange handler when text is input', () => {
    const handleChange = vi.fn();
    render(<Input data-testid="input-component" onChange={handleChange} />);
    const input = screen.getByTestId('input-component');
    fireEvent.change(input, { target: { value: 'new value' } });
    expect(handleChange).toHaveBeenCalled();
  });

  it('has premium input class', () => {
    render(<Input data-testid="input-component" />);
    const input = screen.getByTestId('input-component');
    expect(input.className).toContain('input-premium');
  });
});
