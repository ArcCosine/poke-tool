import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppProvider } from '../../context/AppContext';
import { DurabilityOptimizer } from './DurabilityOptimizer';

describe('DurabilityOptimizer', () => {
  const defaultProps = {
    baseStats: {
      hp: 35, // Pikachu
      defense: 40,
      sp_defense: 50,
    },
    currentEvs: {
      hp: 0,
      attack: 0,
      defense: 0,
      sp_attack: 0,
      sp_defense: 0,
      speed: 0,
    },
    nature: 'neutral',
    onApplyHbdEvs: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = (props = defaultProps) =>
    render(
      <AppProvider>
        <DurabilityOptimizer {...props} />
      </AppProvider>
    );

  it('renders durability indices section with formatted numbers', () => {
    renderComponent();

    // Check headings and labels
    expect(screen.getByText('耐久指数')).toBeDefined();
    expect(screen.getByText('物理')).toBeDefined();
    expect(screen.getByText('特殊')).toBeDefined();
    expect(screen.getByText('総合')).toBeDefined();

    // Pikachu at step 0:
    // HP = 110
    // Defense = 60
    // SpDefense = 70
    // Physical = 110 * 60 = 6,600
    // Special = 110 * 70 = 7,700
    // Total = 14,300
    expect(screen.getByText('6,600')).toBeDefined();
    expect(screen.getByText('7,700')).toBeDefined();
    expect(screen.getByText('14,300')).toBeDefined();
  });

  it('does not render multiplier selects (defense and spDefense multipliers)', () => {
    renderComponent();

    expect(screen.queryByLabelText(/防御倍率/i)).toBeNull();
    expect(screen.queryByLabelText(/特防倍率/i)).toBeNull();
  });

  it('allows switching calculation style between balance and performance', () => {
    renderComponent();

    const balanceRadio = screen.getByRole('radio', {
      name: /バランス/i,
    }) as HTMLInputElement;
    const performanceRadio = screen.getByRole('radio', {
      name: /総合重視/i,
    }) as HTMLInputElement;

    expect(balanceRadio.checked).toBe(true);
    expect(performanceRadio.checked).toBe(false);

    fireEvent.click(performanceRadio);
    expect(performanceRadio.checked).toBe(true);
  });

  it('calls onApplyHbdEvs with optimal distribution when calculation button is clicked', () => {
    renderComponent();

    const calcBtn = screen.getByRole('button', {
      name: /HBDへの最適配分を計算/i,
    });
    fireEvent.click(calcBtn);

    expect(defaultProps.onApplyHbdEvs).toHaveBeenCalledTimes(1);
    const applied = defaultProps.onApplyHbdEvs.mock.calls[0][0];

    // Pikachu should have 32 in HP and total 66
    expect(applied.hp).toBe(32);
    expect(applied.hp + applied.defense + applied.sp_defense).toBe(66);
  });
});
