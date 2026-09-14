import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AppProvider } from '../../context/AppContext';
import { PartyControls } from './PartyControls';

describe('PartyControls Component', () => {
  it('renders all control buttons and triggers callbacks on click', () => {
    const onCopyPokesol = vi.fn();
    const onNewParty = vi.fn();
    const onShareParty = vi.fn();
    const onDeleteParty = vi.fn();
    const onSaveParty = vi.fn();

    render(
      <AppProvider>
        <PartyControls
          onCopyPokesol={onCopyPokesol}
          isCopied={false}
          onNewParty={onNewParty}
          onShareParty={onShareParty}
          onDeleteParty={onDeleteParty}
          onSaveParty={onSaveParty}
          hasActiveMembers={true}
        />
      </AppProvider>
    );

    // Verify all buttons exist
    const copyBtn = screen.getByRole('button', {
      name: /クリップボードにコピー/i,
    });
    const newBtn = screen.getByRole('button', { name: /新規作成/i });
    const shareBtn = screen.getByRole('button', { name: /シェア/i });
    const deleteBtn = screen.getByRole('button', { name: /削除/i });
    const saveBtn = screen.getByRole('button', { name: /パーティを保存/i });

    expect(copyBtn).toBeDefined();
    expect(newBtn).toBeDefined();
    expect(shareBtn).toBeDefined();
    expect(deleteBtn).toBeDefined();
    expect(saveBtn).toBeDefined();

    // Click events
    fireEvent.click(copyBtn);
    expect(onCopyPokesol).toHaveBeenCalled();

    fireEvent.click(newBtn);
    expect(onNewParty).toHaveBeenCalled();

    fireEvent.click(shareBtn);
    expect(onShareParty).toHaveBeenCalled();

    fireEvent.click(deleteBtn);
    expect(onDeleteParty).toHaveBeenCalled();

    fireEvent.click(saveBtn);
    expect(onSaveParty).toHaveBeenCalled();
  });

  it('disables copy and share buttons when hasActiveMembers is false', () => {
    render(
      <AppProvider>
        <PartyControls
          onCopyPokesol={vi.fn()}
          isCopied={false}
          onNewParty={vi.fn()}
          onShareParty={vi.fn()}
          onDeleteParty={vi.fn()}
          onSaveParty={vi.fn()}
          hasActiveMembers={false}
        />
      </AppProvider>
    );

    const copyBtn = screen.getByRole('button', {
      name: /クリップボードにコピー/i,
    }) as HTMLButtonElement;
    const shareBtn = screen.getByRole('button', {
      name: /シェア/i,
    }) as HTMLButtonElement;

    expect(copyBtn.disabled).toBe(true);
    expect(shareBtn.disabled).toBe(true);
  });
});
