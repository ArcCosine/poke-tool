import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Dialog } from './Dialog';

describe('Dialog Component', () => {
  it('does not render when isOpen is false', () => {
    render(
      <Dialog isOpen={false} onClose={vi.fn()} title="Test Dialog">
        Content
      </Dialog>
    );
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('renders title and children when isOpen is true', () => {
    render(
      <Dialog isOpen={true} onClose={vi.fn()} title="Test Dialog">
        <p>Dialog Body Content</p>
      </Dialog>
    );
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(screen.getByText('Test Dialog')).toBeTruthy();
    expect(screen.getByText('Dialog Body Content')).toBeTruthy();
  });

  it('calls onClose when close button is clicked', () => {
    const handleClose = vi.fn();
    render(
      <Dialog isOpen={true} onClose={handleClose} title="Test Dialog">
        Content
      </Dialog>
    );
    const closeBtn = screen.getByRole('button', { name: /close|閉じる/i });
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when backdrop is clicked', () => {
    const handleClose = vi.fn();
    render(
      <Dialog isOpen={true} onClose={handleClose} title="Test Dialog">
        Content
      </Dialog>
    );
    const backdrop = screen.getByTestId('dialog-backdrop');
    fireEvent.click(backdrop);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
