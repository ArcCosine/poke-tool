import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Checkbox } from './Checkbox';

describe('Checkbox Component', () => {
  it('renders checkbox and its label correctly', () => {
    render(<Checkbox id="test-checkbox" label="Enable mega" />);
    expect(screen.getByLabelText('Enable mega')).toBeDefined();
    const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
    expect(checkbox).toBeDefined();
    expect(checkbox.checked).toBe(false);
  });

  it('reflects checked status', () => {
    render(
      <Checkbox id="test-checkbox" label="Enable mega" checked readOnly />
    );
    const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
    expect(checkbox.checked).toBe(true);
  });

  it('triggers onChange handler when clicked', () => {
    const handleChange = vi.fn();
    render(
      <Checkbox
        id="test-checkbox"
        label="Enable mega"
        onChange={handleChange}
      />
    );
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    expect(handleChange).toHaveBeenCalled();
  });
});
