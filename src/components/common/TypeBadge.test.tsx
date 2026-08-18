import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AppProvider } from '../../context/AppContext';
import { TypeBadge } from './TypeBadge';

describe('TypeBadge Component', () => {
  it('renders type icon and default text correctly', () => {
    render(
      <AppProvider>
        <TypeBadge typeKey="fire" />
      </AppProvider>
    );

    const img = screen.getByRole('img') as HTMLImageElement;
    expect(img).toBeDefined();
    expect(img.src).toContain('/assets/type-icons/fire.svg');
    expect(screen.getByText('ほのお')).toBeDefined();
  });

  it('renders without text when showText is false', () => {
    render(
      <AppProvider>
        <TypeBadge typeKey="fire" showText={false} />
      </AppProvider>
    );

    const img = screen.getByRole('img');
    expect(img).toBeDefined();
    expect(screen.queryByText('ほのお')).toBeNull();
  });

  it('applies hidden class to text wrapper when responsiveText is true', () => {
    const { container } = render(
      <AppProvider>
        <TypeBadge typeKey="fire" responsiveText />
      </AppProvider>
    );

    const textSpan = container.querySelector('span > span');
    expect(textSpan).toBeDefined();
    expect(textSpan?.className).toContain('hidden');
    expect(textSpan?.className).toContain('sm:inline');
  });
});
