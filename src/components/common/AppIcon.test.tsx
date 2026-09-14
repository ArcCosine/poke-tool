import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AppIcon } from './AppIcon';

describe('AppIcon', () => {
  it('renders correctly with default size', () => {
    const { container } = render(<AppIcon />);
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
    expect(svg?.getAttribute('viewBox')).toBe('0 0 512 512');
  });

  it('applies custom className', () => {
    const { container } = render(<AppIcon className="w-8 h-8" />);
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
    const cls = svg?.getAttribute('class') || '';
    expect(cls).toContain('w-8');
    expect(cls).toContain('h-8');
  });
});
