import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { EvStatInput } from './EvStatInput';

describe('EvStatInput', () => {
  it('renders correctly with given value', () => {
    const handleChange = vi.fn();
    render(
      <EvStatInput
        stat="hp"
        value={16}
        maxAllowed={32}
        onChange={handleChange}
      />
    );

    const input = screen.getByRole('spinbutton') as HTMLInputElement;
    expect(input.value).toBe('16');
    expect(screen.getByRole('button', { name: '0' })).toBeDefined();
    expect(screen.getByRole('button', { name: '-1' })).toBeDefined();
    expect(screen.getByRole('button', { name: '+1' })).toBeDefined();
    expect(screen.getByRole('button', { name: '32' })).toBeDefined();

    // 換算表示（EV: など）が存在しないことを検証
    expect(screen.queryByText(/EV/i)).toBeNull();
    expect(screen.queryByText(/換算/i)).toBeNull();
  });

  it('calls onChange with value + 1 when +1 button is clicked', () => {
    const handleChange = vi.fn();
    render(
      <EvStatInput
        stat="attack"
        value={10}
        maxAllowed={32}
        onChange={handleChange}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: '+1' }));
    expect(handleChange).toHaveBeenCalledWith(11);
  });

  it('calls onChange with value - 1 when -1 button is clicked', () => {
    const handleChange = vi.fn();
    render(
      <EvStatInput
        stat="defense"
        value={10}
        maxAllowed={32}
        onChange={handleChange}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: '-1' }));
    expect(handleChange).toHaveBeenCalledWith(9);
  });

  it('calls onChange with 0 when 0 button is clicked', () => {
    const handleChange = vi.fn();
    render(
      <EvStatInput
        stat="sp_attack"
        value={10}
        maxAllowed={32}
        onChange={handleChange}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: '0' }));
    expect(handleChange).toHaveBeenCalledWith(0);
  });

  it('calls onChange with maxAllowed when 32 button is clicked', () => {
    const handleChange = vi.fn();
    render(
      <EvStatInput
        stat="speed"
        value={10}
        maxAllowed={25}
        onChange={handleChange}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: '32' }));
    expect(handleChange).toHaveBeenCalledWith(25);
  });

  it('disables 0 and -1 buttons when value is 0', () => {
    render(
      <EvStatInput stat="speed" value={0} maxAllowed={32} onChange={vi.fn()} />
    );

    expect(
      (screen.getByRole('button', { name: '0' }) as HTMLButtonElement).disabled
    ).toBe(true);
    expect(
      (screen.getByRole('button', { name: '-1' }) as HTMLButtonElement).disabled
    ).toBe(true);
    expect(
      (screen.getByRole('button', { name: '+1' }) as HTMLButtonElement).disabled
    ).toBe(false);
    expect(
      (screen.getByRole('button', { name: '32' }) as HTMLButtonElement).disabled
    ).toBe(false);
  });

  it('disables +1 and 32 buttons when value reaches maxAllowed', () => {
    render(
      <EvStatInput stat="speed" value={20} maxAllowed={20} onChange={vi.fn()} />
    );

    expect(
      (screen.getByRole('button', { name: '0' }) as HTMLButtonElement).disabled
    ).toBe(false);
    expect(
      (screen.getByRole('button', { name: '-1' }) as HTMLButtonElement).disabled
    ).toBe(false);
    expect(
      (screen.getByRole('button', { name: '+1' }) as HTMLButtonElement).disabled
    ).toBe(true);
    expect(
      (screen.getByRole('button', { name: '32' }) as HTMLButtonElement).disabled
    ).toBe(true);
  });

  it('handles direct input and clamps within bounds', () => {
    const handleChange = vi.fn();
    render(
      <EvStatInput
        stat="hp"
        value={10}
        maxAllowed={24}
        onChange={handleChange}
      />
    );

    const input = screen.getByRole('spinbutton');

    // 通常の入力
    fireEvent.change(input, { target: { value: '15' } });
    expect(handleChange).toHaveBeenCalledWith(15);

    // 最大許容量を超える入力
    fireEvent.change(input, { target: { value: '30' } });
    expect(handleChange).toHaveBeenCalledWith(24);

    // 0未満の入力
    fireEvent.change(input, { target: { value: '-5' } });
    expect(handleChange).toHaveBeenCalledWith(0);
  });
});
