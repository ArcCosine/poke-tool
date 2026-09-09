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

  it('applies high-visibility background, border, and text colors for variant danger', () => {
    render(<Button variant="danger">Delete</Button>);
    const button = screen.getByRole('button');
    expect(button.className).toContain('bg-red-100');
    expect(button.className).toContain('dark:bg-red-950/60');
    expect(button.className).toContain('border-red-300');
    expect(button.className).toContain('dark:border-red-800');
    expect(button.className).toContain('text-red-700');
    expect(button.className).toContain('dark:text-red-300');
  });

  it('applies dark mode text color for variant dashed to support dark mode readability', () => {
    render(<Button variant="dashed">Add</Button>);
    const button = screen.getByRole('button');
    expect(button.className).toContain('dark:text-slate-300');
  });
});
