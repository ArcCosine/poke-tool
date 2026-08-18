import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Button } from './Button';

describe('Button Component', () => {
  it('renders children correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeDefined();
  });

  it('triggers onClick handler when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies the primary class by default', () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole('button');
    expect(button.className).toContain('btn-primary');
  });

  it('applies the appropriate class for variant secondary', () => {
    render(<Button variant="secondary">Click me</Button>);
    const button = screen.getByRole('button');
    expect(button.className).toContain('btn-secondary');
  });

  it('applies the appropriate class for variant dashed', () => {
    render(<Button variant="dashed">Click me</Button>);
    const button = screen.getByRole('button');
    expect(button.className).toContain('border-dashed');
  });

  it('renders an icon if specified', () => {
    const { container } = render(<Button icon="i-lucide-save">Save</Button>);
    const iconElement = container.querySelector('.i-lucide-save');
    expect(iconElement).toBeTruthy();
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Click me</Button>);
    const button = screen.getByRole('button') as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });
});
