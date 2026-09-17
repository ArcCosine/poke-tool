import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AppProvider } from '../../context/AppContext';
import { PartyControls } from './PartyControls';

describe('PartyControls Component', () => {
  it('renders all 6 control buttons in the specified order and triggers callbacks', () => {
    const onNewParty = vi.fn();
    const onOpenPublishDialog = vi.fn();
    const onShareParty = vi.fn();
    const onCopyPokesol = vi.fn();
    const onSaveParty = vi.fn();
    const onDeleteParty = vi.fn();

    render(
      <AppProvider>
        <PartyControls
          onNewParty={onNewParty}
          onOpenPublishDialog={onOpenPublishDialog}
          onShareParty={onShareParty}
          onCopyPokesol={onCopyPokesol}
          isCopied={false}
          onSaveParty={onSaveParty}
          onDeleteParty={onDeleteParty}
          hasActiveMembers={true}
          isPublic={false}
        />
      </AppProvider>
    );

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(6);

    // Verify order: 新規作成 -> ランキングに公開する -> シェア -> クリップボードにコピー -> パーティを保存 -> 削除
    expect(buttons[0].textContent).toMatch(/新規作成/i);
    expect(buttons[1].textContent).toMatch(/ランキングに公開する/i);
    expect(buttons[2].textContent).toMatch(/シェア/i);
    expect(buttons[3].textContent).toMatch(/クリップボードにコピー/i);
    expect(buttons[4].textContent).toMatch(/パーティを保存/i);
    expect(buttons[5].textContent).toMatch(/削除/i);

    // Trigger click events
    fireEvent.click(buttons[0]);
    expect(onNewParty).toHaveBeenCalled();

    fireEvent.click(buttons[1]);
    expect(onOpenPublishDialog).toHaveBeenCalled();

    fireEvent.click(buttons[2]);
    expect(onShareParty).toHaveBeenCalled();

    fireEvent.click(buttons[3]);
    expect(onCopyPokesol).toHaveBeenCalled();

    fireEvent.click(buttons[4]);
    expect(onSaveParty).toHaveBeenCalled();

    fireEvent.click(buttons[5]);
    expect(onDeleteParty).toHaveBeenCalled();
  });

  it('disables copy, share, and publish buttons when hasActiveMembers is false', () => {
    render(
      <AppProvider>
        <PartyControls
          onNewParty={vi.fn()}
          onOpenPublishDialog={vi.fn()}
          onShareParty={vi.fn()}
          onCopyPokesol={vi.fn()}
          isCopied={false}
          onSaveParty={vi.fn()}
          onDeleteParty={vi.fn()}
          hasActiveMembers={false}
          isPublic={false}
        />
      </AppProvider>
    );

    const publishBtn = screen.getByRole('button', {
      name: /ランキングに公開する/i,
    }) as HTMLButtonElement;
    const shareBtn = screen.getByRole('button', {
      name: /シェア/i,
    }) as HTMLButtonElement;
    const copyBtn = screen.getByRole('button', {
      name: /クリップボードにコピー/i,
    }) as HTMLButtonElement;

    expect(publishBtn.disabled).toBe(true);
    expect(shareBtn.disabled).toBe(true);
    expect(copyBtn.disabled).toBe(true);
  });
});
