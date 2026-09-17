import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AppProvider } from '../../context/AppContext';
import { PublishDialog } from './PublishDialog';

describe('PublishDialog Component', () => {
  it('shows login prompt when user is not logged in', () => {
    const onOpenLogin = vi.fn();

    render(
      <AppProvider>
        <PublishDialog
          isOpen={true}
          onClose={vi.fn()}
          isLoggedIn={false}
          onOpenLogin={onOpenLogin}
          isPublic={false}
          rentalCode=""
          articleUrl=""
          description=""
          onSave={vi.fn()}
        />
      </AppProvider>
    );

    const loginBtn = screen.getByRole('button', { name: /ログイン/i });
    expect(loginBtn).toBeDefined();

    fireEvent.click(loginBtn);
    expect(onOpenLogin).toHaveBeenCalled();
  });

  it('renders inputs and triggers onSave with updated meta when user is logged in', () => {
    const onSave = vi.fn();
    const onClose = vi.fn();

    render(
      <AppProvider>
        <PublishDialog
          isOpen={true}
          onClose={onClose}
          isLoggedIn={true}
          onOpenLogin={vi.fn()}
          isPublic={false}
          rentalCode=""
          articleUrl=""
          description=""
          onSave={onSave}
        />
      </AppProvider>
    );

    // Checkbox for isPublic
    const publicCheckbox = screen.getByLabelText(/ランキングに公開する/);
    fireEvent.click(publicCheckbox);

    // Rental code input
    const rentalInput = screen.getByLabelText(/レンタルチームコード/);
    fireEvent.change(rentalInput, { target: { value: 'RENTAL-777' } });

    // Article URL input
    const articleInput = screen.getByLabelText(/構築記事URL/);
    fireEvent.change(articleInput, {
      target: { value: 'https://note.com/my-build' },
    });

    // Description input
    const descInput = screen.getByLabelText(/構築の解説・立ち回り/);
    fireEvent.change(descInput, {
      target: { value: '初手メガガルーラで展開' },
    });

    // Author Name input (Trainer Name)
    const authorInput = screen.getByLabelText(/ユーザー名/i);
    expect(authorInput).toBeDefined();
    fireEvent.change(authorInput, {
      target: { value: 'レッド' },
    });

    // Save button
    const saveBtn = screen.getByRole('button', { name: /保存|決定/ });
    fireEvent.click(saveBtn);

    expect(onSave).toHaveBeenCalledWith({
      isPublic: true,
      rentalCode: 'RENTAL-777',
      articleUrl: 'https://note.com/my-build',
      description: '初手メガガルーラで展開',
      authorName: 'レッド',
    });
  });
});
