import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { AppProvider } from '../../context/AppContext';
import { SyncDialog } from './SyncDialog';

describe('SyncDialog component', () => {
  const renderWithContext = (ui: React.ReactElement) => {
    return render(<AppProvider>{ui}</AppProvider>);
  };

  it('should render dialog with title, pending count and buttons when open', () => {
    renderWithContext(
      <SyncDialog
        isOpen={true}
        pendingCount={3}
        onConfirm={vi.fn()}
        onDismiss={vi.fn()}
      />
    );

    expect(screen.getByText('パーティデータの同期')).toBeDefined();
    expect(screen.getByText('同期して保存')).toBeDefined();
    expect(screen.getByText('スキップ')).toBeDefined();
  });

  it('should trigger onConfirm when sync button is clicked', () => {
    const onConfirm = vi.fn();
    renderWithContext(
      <SyncDialog
        isOpen={true}
        pendingCount={2}
        onConfirm={onConfirm}
        onDismiss={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText('同期して保存'));
    expect(onConfirm).toHaveBeenCalled();
  });

  it('should trigger onDismiss when skip button is clicked', () => {
    const onDismiss = vi.fn();
    renderWithContext(
      <SyncDialog
        isOpen={true}
        pendingCount={2}
        onConfirm={vi.fn()}
        onDismiss={onDismiss}
      />
    );

    fireEvent.click(screen.getByText('スキップ'));
    expect(onDismiss).toHaveBeenCalled();
  });
});
