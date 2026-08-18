import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AppProvider } from '../../context/AppContext';
import { Autocomplete } from './Autocomplete';

describe('Autocomplete Component', () => {
  const suggestions = ['こだわりハチマキ', 'こだわりメガネ', 'きあいのタスキ'];

  it('renders input with initial value', () => {
    render(
      <AppProvider>
        <Autocomplete
          value="こだわりハチマキ"
          suggestions={suggestions}
          onChange={() => {}}
        />
      </AppProvider>
    );

    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input).toBeDefined();
    expect(input.value).toBe('こだわりハチマキ');
  });

  it('shows suggestions on focus and filters by hiragana', async () => {
    const handleChange = vi.fn();
    render(
      <AppProvider>
        <Autocomplete
          value=""
          suggestions={suggestions}
          onChange={handleChange}
          placeholder="検索..."
        />
      </AppProvider>
    );

    const input = screen.getByPlaceholderText('検索...') as HTMLInputElement;
    fireEvent.focus(input);

    // Should show all suggestions on focus
    expect(screen.getByText('こだわりハチマキ')).toBeDefined();
    expect(screen.getByText('きあいのタスキ')).toBeDefined();

    // Type hiragana "こだわり"
    fireEvent.change(input, { target: { value: 'こだわり' } });

    // Should filter to show only "こだわりハチマキ" and "こだわりメガネ"
    expect(screen.getByText('こだわりハチマキ')).toBeDefined();
    expect(screen.getByText('こだわりメガネ')).toBeDefined();
    expect(screen.queryByText('きあいのタスキ')).toBeNull();
  });

  it('calls onChange with selected value when suggestion is clicked', async () => {
    const handleChange = vi.fn();
    render(
      <AppProvider>
        <Autocomplete
          value=""
          suggestions={suggestions}
          onChange={handleChange}
          placeholder="検索..."
        />
      </AppProvider>
    );

    const input = screen.getByPlaceholderText('検索...') as HTMLInputElement;
    fireEvent.focus(input);

    const option = screen.getByText('きあいのタスキ');
    fireEvent.click(option);

    expect(handleChange).toHaveBeenCalledWith('きあいのタスキ');
  });
});
