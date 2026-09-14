import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AppProvider } from '../../context/AppContext';
import { PartySearch } from './PartySearch';

describe('PartySearch Component', () => {
  const mockParties = [
    { id: '1', name: 'ガチ対戦パ' },
    { id: '2', name: '雨パ' },
  ];

  it('renders editing party status and saved parties count', () => {
    render(
      <AppProvider>
        <PartySearch
          partyName="ガチ対戦パ"
          parties={mockParties}
          onSelectParty={vi.fn()}
          onPartyNameChange={vi.fn()}
        />
      </AppProvider>
    );

    expect(screen.getByText('ガチ対戦パ')).toBeDefined();
    expect(screen.getByText(/全 2 個のパーティ中/)).toBeDefined();
  });

  it('triggers onSelectParty when an existing party is selected from autocomplete', () => {
    const onSelectParty = vi.fn();
    const onPartyNameChange = vi.fn();

    render(
      <AppProvider>
        <PartySearch
          partyName=""
          parties={mockParties}
          onSelectParty={onSelectParty}
          onPartyNameChange={onPartyNameChange}
        />
      </AppProvider>
    );

    const input = screen.getByLabelText(/パーティの検索・名前変更/i);
    fireEvent.focus(input);

    const optionBtn = screen.getByRole('button', { name: '雨パ' });
    fireEvent.click(optionBtn);

    expect(onSelectParty).toHaveBeenCalledWith('2');
  });

  it('triggers onPartyNameChange when clearing or selecting custom party name', () => {
    const onSelectParty = vi.fn();
    const onPartyNameChange = vi.fn();

    render(
      <AppProvider>
        <PartySearch
          partyName="ガチ対戦パ"
          parties={mockParties}
          onSelectParty={onSelectParty}
          onPartyNameChange={onPartyNameChange}
        />
      </AppProvider>
    );

    const input = screen.getByLabelText(/パーティの検索・名前変更/i);
    fireEvent.change(input, { target: { value: '' } });

    expect(onPartyNameChange).toHaveBeenCalledWith('');
  });
});
