import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AppProvider } from '../../context/AppContext';
import { NatureSelect } from './NatureSelect';

describe('NatureSelect Component', () => {
  it('renders all natures with modifiers like (+A -C)', () => {
    const handleChange = vi.fn();

    render(
      <AppProvider>
        <NatureSelect
          id="nature-select-test"
          label="性格"
          value="adamant"
          onChange={handleChange}
        />
      </AppProvider>
    );

    // Label should be rendered
    expect(screen.getByText('性格')).toBeDefined();

    // Select should exist with value adamant
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.value).toBe('adamant');

    // Check that option has modifier label (+A -C) for いじっぱり (adamant)
    const options = screen.getAllByRole('option');
    expect(options.length).toBe(25);

    const adamantOption = options.find(
      (o) => (o as HTMLOptionElement).value === 'adamant'
    );
    expect(adamantOption?.textContent).toContain('(+A -C)');

    const modestOption = options.find(
      (o) => (o as HTMLOptionElement).value === 'modest'
    );
    expect(modestOption?.textContent).toContain('(+C -A)');

    // Neutral nature should not have (+ -) modifier
    const bashfulOption = options.find(
      (o) => (o as HTMLOptionElement).value === 'bashful'
    );
    expect(bashfulOption?.textContent).not.toContain('(+');
  });

  it('calls onChange with new nature id when selection changes', () => {
    const handleChange = vi.fn();

    render(
      <AppProvider>
        <NatureSelect
          id="nature-select-test"
          label="性格"
          value="neutral"
          onChange={handleChange}
        />
      </AppProvider>
    );

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'jolly' } });

    expect(handleChange).toHaveBeenCalledWith('jolly');
  });
});
